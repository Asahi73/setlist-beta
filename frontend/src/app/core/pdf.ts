// セットリストの「本物のPDF」をクライアントで生成する（jsPDF + autoTable）。
//
// 印刷ダイアログ（window.print）方式の弱点（ヘッダ/フッタ混入・背景未印刷・
// Safariのiframe印刷不具合・倍率依存）を避けるため、PDFを直接組み立ててBlobで返す。
// 全ブラウザ・スマホで同一の出力になる。
//
// 日本語フォント(Noto Sans JP Regular/Bold)は public/fonts に置き、PDF生成時のみ取得する
// （初期表示には影響しない）。

import type { jsPDF as JsPDF } from 'jspdf';
import { PdfMode, Setlist } from './models';

const NEON: [number, number, number] = [0xeb, 0xff, 0x00];
const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [0, 0, 0];
const FONT = 'NotoSansJP';

// ---- 共通ヘルパ（曲数・合計時間・★などの整形）-------------------------------

function formatDuration(sec: number): string {
  if (sec <= 0) return '';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

function songCount(s: Setlist): number {
  return s.songs.filter((r) => r.kind === 'song').length;
}

function totalDuration(s: Setlist): string {
  const t = s.songs
    .filter((r) => r.kind === 'song' && r.duration_sec > 0)
    .reduce((sum, r) => sum + r.duration_sec, 0);
  return t > 0 ? formatDuration(t) : '-';
}

function excitementStars(level: number): string {
  if (level <= 0) return '';
  return '★'.repeat(level) + '☆'.repeat(5 - level);
}

function metaLine(s: Setlist): string {
  const parts: string[] = [];
  if (s.slot_time.trim()) parts.push(`持ち時間 ${s.slot_time}`);
  parts.push(`全${songCount(s)}曲`);
  parts.push(`演奏 ${totalDuration(s)}`);
  return parts.join(' / ');
}

// ---- 純粋ビルダー（jsPDF/autoTable を引数で受け取る＝テスト可能）-------------

export interface PdfFonts {
  regular: string; // base64 TTF
  bold: string; // base64 TTF
}

type AutoTable = (doc: JsPDF, options: Record<string, unknown>) => void;
type Ctor = new (options?: Record<string, unknown>) => JsPDF;

function registerFonts(doc: JsPDF, fonts: PdfFonts): void {
  doc.addFileToVFS('NotoSansJP-Regular.ttf', fonts.regular);
  doc.addFont('NotoSansJP-Regular.ttf', FONT, 'normal');
  doc.addFileToVFS('NotoSansJP-Bold.ttf', fonts.bold);
  doc.addFont('NotoSansJP-Bold.ttf', FONT, 'bold');
  doc.setFont(FONT, 'normal');
}

export function buildSetlistPdfDoc(
  JsPDFCtor: Ctor,
  autoTable: AutoTable,
  setlist: Setlist,
  mode: PdfMode,
  fonts: PdfFonts,
): JsPDF {
  const doc = new JsPDFCtor({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  registerFonts(doc, fonts);
  if (mode === 'color') {
    buildColor(doc, autoTable, setlist, fonts);
  } else {
    buildMono(doc, autoTable, setlist);
  }
  return doc;
}

// ---- color（ステージ用・黒背景＋蛍光イエロー）-------------------------------

function buildColor(doc: JsPDF, autoTable: AutoTable, s: Setlist, _fonts: PdfFonts): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;

  // 1ページ目の背景（黒）を先に塗ってからヘッダを描く
  paintBlack(doc, pageW, pageH);

  // ヘッダ: タイトル(蛍光)＋メタ(白)
  doc.setFont(FONT, 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...NEON);
  doc.text(s.title || 'セットリスト', margin, 20);
  doc.setFont(FONT, 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text(metaLine(s), margin, 27);

  // 行データと種別を並行配列で持つ（didDrawCell で種別判定に使う）
  const kinds: string[] = [];
  const body: unknown[] = [];
  let no = 0;
  for (const r of s.songs) {
    if (r.kind === 'encore') {
      kinds.push('encore');
      body.push([
        {
          content: r.title || 'アンコール',
          colSpan: 5,
          styles: { halign: 'center', fontStyle: 'bold', textColor: NEON, fontSize: 15 },
        },
      ]);
      continue;
    }
    if (r.kind === 'mc') {
      kinds.push('mc');
      body.push([
        {
          content: 'MC',
          styles: {
            fontStyle: 'bold',
            textColor: WHITE,
            fontSize: 11,
            halign: 'center',
            overflow: 'visible',
            cellPadding: { top: 2, bottom: 2, left: 0.5, right: 0.5 },
          },
        },
        { content: r.title || 'MC', colSpan: 3, styles: { textColor: WHITE, fontSize: 12 } },
        { content: r.note, styles: { textColor: WHITE, fontSize: 10 } },
      ]);
      continue;
    }
    no += 1;
    kinds.push('song');
    body.push([
      { content: String(no), styles: { textColor: WHITE, fontSize: 13 } },
      { content: r.title, styles: { fontStyle: 'bold', textColor: NEON, fontSize: 20 } },
      { content: r.key, styles: { textColor: WHITE, fontSize: 14 } },
      { content: formatDuration(r.duration_sec), styles: { textColor: WHITE, fontSize: 14 } },
      { content: r.note, styles: { textColor: WHITE, fontSize: 10 } },
    ]);
  }

  autoTable(doc, {
    startY: 32,
    margin: { left: margin, right: margin, top: 12, bottom: 10 },
    body,
    theme: 'plain',
    styles: {
      font: FONT,
      fontSize: 14,
      textColor: WHITE,
      cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
      valign: 'middle',
      lineWidth: 0,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { cellWidth: 16 },
      3: { cellWidth: 16, halign: 'left' },
      4: { cellWidth: 40 },
    },
    willDrawPage: (data: any) => {
      // 2ページ目以降の背景（1ページ目は上で塗り済み）
      if (data.pageNumber > 1) paintBlack(doc, pageW, pageH);
    },
    didDrawCell: (data: any) => {
      if (data.section !== 'body') return;
      const kind = kinds[data.row.index];
      const x = data.cell.x;
      const y = data.cell.y;
      const w = data.cell.width;
      const h = data.cell.height;
      if (kind === 'encore') {
        // 上下に蛍光ボーダー
        doc.setDrawColor(...NEON);
        doc.setLineWidth(0.6);
        doc.line(x, y, x + w, y);
        doc.line(x, y + h, x + w, y + h);
      } else {
        // 行下の薄い区切り(#333)
        doc.setDrawColor(51, 51, 51);
        doc.setLineWidth(0.2);
        doc.line(x, y + h, x + w, y + h);
      }
    },
  });
}

function paintBlack(doc: JsPDF, w: number, h: number): void {
  doc.setFillColor(...BLACK);
  doc.rect(0, 0, w, h, 'F');
}

// ---- mono（印刷用・白地に黒、列名あり）--------------------------------------

function buildMono(doc: JsPDF, autoTable: AutoTable, s: Setlist): void {
  const margin = 15;

  doc.setFont(FONT, 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...BLACK);
  doc.text(s.title || 'セットリスト', margin, 22);
  doc.setFont(FONT, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(68, 68, 68);
  doc.text(metaLine(s), margin, 28);

  const kinds: string[] = [];
  const body: unknown[] = [];
  let no = 0;
  for (const r of s.songs) {
    if (r.kind === 'encore') {
      kinds.push('encore');
      body.push([
        {
          content: r.title || 'アンコール',
          colSpan: 6,
          styles: { halign: 'center', fontStyle: 'bold', fillColor: [238, 238, 238] },
        },
      ]);
      continue;
    }
    if (r.kind === 'mc') {
      kinds.push('mc');
      body.push([
        {
          content: 'MC',
          styles: {
            fontStyle: 'bold',
            halign: 'center',
            overflow: 'visible',
            cellPadding: { top: 1.8, bottom: 1.8, left: 0.5, right: 0.5 },
          },
        },
        { content: r.title || 'MC', colSpan: 4, styles: { textColor: [85, 85, 85] } },
        { content: r.note, styles: { textColor: [85, 85, 85] } },
      ]);
      continue;
    }
    no += 1;
    kinds.push('song');
    body.push([
      String(no),
      r.title,
      r.key,
      formatDuration(r.duration_sec),
      excitementStars(r.excitement),
      r.note,
    ]);
  }

  autoTable(doc, {
    startY: 33,
    margin: { left: margin, right: margin, top: 15, bottom: 15 },
    head: [['#', '曲名', 'Key', '時間', '盛り上がり', '備考']],
    body,
    theme: 'plain',
    styles: {
      font: FONT,
      fontSize: 11,
      textColor: BLACK,
      cellPadding: { top: 1.8, bottom: 1.8, left: 1.5, right: 1.5 },
      valign: 'middle',
      lineWidth: 0,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: BLACK,
      textColor: WHITE,
      fontSize: 10,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 8 },
      2: { cellWidth: 16 },
      3: { cellWidth: 18 },
      4: { cellWidth: 30 },
      5: { cellWidth: 40 },
    },
    didDrawCell: (data: any) => {
      if (data.section !== 'body') return;
      // 行下の区切り線（黒）
      doc.setDrawColor(...BLACK);
      doc.setLineWidth(0.2);
      const x = data.cell.x;
      const yb = data.cell.y + data.cell.height;
      doc.line(x, yb, x + data.cell.width, yb);
    },
  });
}

// ---- ブラウザ用ラッパー（遅延ロード＋フォント取得）---------------------------

let fontCache: PdfFonts | null = null;

async function fetchFontBase64(file: string): Promise<string> {
  const url = new URL(`fonts/${file}`, document.baseURI).href;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`フォント取得に失敗: ${file} (${res.status})`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function loadFonts(): Promise<PdfFonts> {
  if (fontCache) return fontCache;
  const [regular, bold] = await Promise.all([
    fetchFontBase64('NotoSansJP-Regular.ttf'),
    fetchFontBase64('NotoSansJP-Bold.ttf'),
  ]);
  fontCache = { regular, bold };
  return fontCache;
}

// 編集中のセットリストからPDF(Blob)を生成する。jsPDF/autoTableは遅延import。
export async function generateSetlistPdf(setlist: Setlist, mode: PdfMode): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default as unknown as AutoTable;
  const fonts = await loadFonts();
  const doc = buildSetlistPdfDoc(jsPDF as unknown as Ctor, autoTable, setlist, mode, fonts);
  return doc.output('blob');
}
