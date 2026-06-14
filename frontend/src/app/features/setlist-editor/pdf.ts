// セットリストの「本物のPDF」をクライアントで生成する（jsPDF + autoTable）。
//
// 印刷ダイアログ（window.print）方式の弱点（ヘッダ/フッタ混入・背景未印刷・
// Safariのiframe印刷不具合・倍率依存）を避けるため、PDFを直接組み立ててBlobで返す。
// 全ブラウザ・スマホで同一の出力になる。
//
// 行数に応じて文字サイズを自動調整し、常に1ページに収める（FIT_MIN/MAX_SCALE）。
// 少なければ曲名を中心に拡大して紙面を埋め、多ければ縮小して1枚に詰める。
//
// 日本語フォント(Noto Sans JP Regular/Bold)は public/fonts に置き、PDF生成時のみ取得する
// （初期表示には影響しない）。

import type { jsPDF as JsPDF } from 'jspdf';
import { PdfMode, Setlist } from '../../core/models';

const NEON: [number, number, number] = [0xeb, 0xff, 0x00];
const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [0, 0, 0];
const FONT = 'NotoSansJP';

// 1ページに収めるためのスケール下限／拡大の上限。
// 多い曲数は下限まで縮小して1枚に詰める。少ない曲数は上限まで拡大するが、
// ページ下端まで埋めて間延びしないよう上限は控えめにし、さらに「曲名が折り返さない範囲」
// （noWrapCap）でも頭打ちにする。
const FIT_MIN_SCALE = 0.5;
const FIT_MAX_SCALE = 1.35;

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

type TableOptions = Record<string, unknown>;
type AutoTable = (doc: JsPDF, options: TableOptions) => void;
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
    buildColor(doc, autoTable, JsPDFCtor, setlist, fonts);
  } else {
    buildMono(doc, autoTable, JsPDFCtor, setlist, fonts);
  }
  return doc;
}

// ---- 1ページに収めるスケール計算 --------------------------------------------

// 曲名（拡大しても折り返したくないテキスト）の指定。スケールに応じた実セル幅も持つ。
interface TitleFit {
  titles: string[]; // 折り返しを避けたい曲名
  fontStyle: 'normal' | 'bold';
  baseSize: number; // スケール1のときの曲名フォントサイズ(pt)
  textWidthAt: (scale: number) => number; // そのスケールでの曲名セルの実テキスト幅(mm)
}

// 実描画と同じ設定を「縦に十分高い仮想ページ」へ描いて表の実高さを測る。折り返し
// （日本語・備考列）まで含めた正確な高さが得られる。フォント解析が重いのでドキュメントは
// 1つだけ作って使い回し、各測定は描画開始Yをずらして縦に積む。曲名の折り返し判定にも使う。
class FitMeasurer {
  // jsPDF のページ寸法上限は 14400pt（≒5080mm）。超えると自動クランプ＆ページ送りで
  // 測定がずれるため、mm 換算で上限未満に収める。
  private readonly H = 5000;
  private readonly tmp: JsPDF;
  private cursor: number;

  constructor(
    JsPDFCtor: Ctor,
    private readonly autoTable: AutoTable,
    fonts: PdfFonts,
    private readonly pageW: number,
    private readonly startY: number,
  ) {
    this.tmp = new JsPDFCtor({ unit: 'mm', format: [pageW, this.H], orientation: 'portrait' });
    registerFonts(this.tmp, fonts);
    this.cursor = startY;
  }

  // スケール scale での表の高さ(mm)。
  height(makeOptions: (scale: number) => TableOptions, scale: number): number {
    // 積み上げで上限に近づいたら改ページしてリセット（測定の取りこぼしを防ぐ）
    if (this.cursor > this.H - 2000) {
      this.tmp.addPage([this.pageW, this.H], 'portrait');
      this.cursor = this.startY;
    }
    const from = this.cursor;
    // 背景塗り/罫線フックは高さに影響しないため測定では外す
    this.autoTable(this.tmp, {
      ...makeOptions(scale),
      startY: from,
      willDrawPage: undefined,
      didDrawCell: undefined,
    });
    const finalY = (this.tmp as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? from;
    this.cursor = finalY + 5; // 次の測定が前の表に重ならないよう少し空ける
    return finalY - from;
  }

  // 曲名が折り返し始める直前までの拡大上限を [1, maxScale] で求める。拡大時のみ効かせ、
  // 元から1倍で折り返す長い曲名では拡大しない（=1を返す＝現状サイズを維持）。
  noWrapCap(fit: TitleFit, maxScale: number): number {
    const wrapsAt = (scale: number): boolean => {
      const w = fit.textWidthAt(scale);
      if (w <= 0) return true;
      this.tmp.setFont(FONT, fit.fontStyle);
      this.tmp.setFontSize(fit.baseSize * scale);
      return fit.titles.some((t) => this.tmp.splitTextToSize(t, w).length > 1);
    };
    if (!wrapsAt(maxScale)) return maxScale;
    if (wrapsAt(1)) return 1;
    let lo = 1;
    let hi = maxScale;
    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2;
      if (wrapsAt(mid)) hi = mid;
      else lo = mid;
    }
    return lo;
  }
}

// available に収まる最大スケールを [MIN, maxScale] で二分探索する。
// 高さはスケールに対してほぼ単調増加なので二分探索が成立する。
function fitScale(measure: (scale: number) => number, available: number, maxScale: number): number {
  if (measure(maxScale) <= available) return maxScale; // 余白あり→上限まで拡大
  if (measure(FIT_MIN_SCALE) > available) return FIT_MIN_SCALE; // 詰めても溢れる→最小で妥協
  let lo = FIT_MIN_SCALE;
  let hi = maxScale;
  for (let i = 0; i < 8; i++) {
    const mid = (lo + hi) / 2;
    if (measure(mid) <= available) lo = mid;
    else hi = mid;
  }
  return lo;
}

// makeOptions（スケール→autoTableオプション）から最適スケールを求めて本番ドキュメントへ描画する。
// 拡大は「曲名が折り返さない範囲(fit)」かつ FIT_MAX_SCALE 以内に抑える。
function drawFitted(
  doc: JsPDF,
  autoTable: AutoTable,
  JsPDFCtor: Ctor,
  fonts: PdfFonts,
  pageW: number,
  startY: number,
  available: number,
  makeOptions: (scale: number) => TableOptions,
  fit: TitleFit,
): void {
  const m = new FitMeasurer(JsPDFCtor, autoTable, fonts, pageW, startY);
  const maxScale = m.noWrapCap(fit, FIT_MAX_SCALE);
  const scale = fitScale((k) => m.height(makeOptions, k), available, maxScale);
  autoTable(doc, makeOptions(scale));
}

// ---- color（ステージ用・黒背景＋蛍光イエロー）-------------------------------

function buildColor(doc: JsPDF, autoTable: AutoTable, JsPDFCtor: Ctor, s: Setlist, fonts: PdfFonts): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  // 本文の左右マージン（白フチ FRAME より内側に取り、黒シートの中に収める）
  const margin = 15;
  const startY = 34;
  const bottom = 14;

  // 1ページ目の背景（白フチ付きの黒シート）を先に塗ってからヘッダを描く
  paintBlack(doc, pageW, pageH);

  // ヘッダ: タイトル(蛍光)＋メタ(白)。ヘッダは固定サイズ（伸縮は表のみ）
  doc.setFont(FONT, 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...NEON);
  doc.text(s.title || 'セットリスト', margin, 22);
  doc.setFont(FONT, 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text(metaLine(s), margin, 29);

  // 種別はスケールに依存しないので一度だけ作る（didDrawCell の行判定に使う）
  const kinds = s.songs.map((r) => r.kind);

  // スケール k に応じて行データ（フォントサイズ）を組み立てる
  const makeBody = (k: number): unknown[] => {
    const z = (n: number) => +(n * k).toFixed(2);
    const body: unknown[] = [];
    let no = 0;
    for (const r of s.songs) {
      if (r.kind === 'encore') {
        body.push([
          {
            content: r.title || 'アンコール',
            colSpan: 5,
            styles: { halign: 'center', fontStyle: 'bold', textColor: NEON, fontSize: z(15) },
          },
        ]);
        continue;
      }
      if (r.kind === 'mc') {
        body.push([
          {
            content: 'MC',
            styles: {
              fontStyle: 'bold',
              textColor: WHITE,
              fontSize: z(11),
              halign: 'center',
              overflow: 'visible',
              cellPadding: { top: z(2), bottom: z(2), left: z(0.5), right: z(0.5) },
            },
          },
          { content: r.title || 'MC', colSpan: 3, styles: { textColor: WHITE, fontSize: z(12) } },
          { content: r.note, styles: { textColor: WHITE, fontSize: z(10) } },
        ]);
        continue;
      }
      no += 1;
      body.push([
        { content: String(no), styles: { textColor: WHITE, fontSize: z(13) } },
        { content: r.title, styles: { fontStyle: 'bold', textColor: NEON, fontSize: z(20) } },
        { content: r.key, styles: { textColor: WHITE, fontSize: z(14) } },
        { content: formatDuration(r.duration_sec), styles: { textColor: WHITE, fontSize: z(14) } },
        { content: r.note, styles: { textColor: WHITE, fontSize: z(10) } },
      ]);
    }
    return body;
  };

  const makeOptions = (k: number): TableOptions => {
    const z = (n: number) => +(n * k).toFixed(2);
    return {
      startY,
      margin: { left: margin, right: margin, top: 16, bottom },
      body: makeBody(k),
      theme: 'plain',
      styles: {
        font: FONT,
        fontSize: z(14),
        textColor: WHITE,
        cellPadding: { top: z(2), bottom: z(2), left: z(2.5), right: z(2.5) },
        valign: 'middle',
        lineWidth: 0,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: z(10) },
        2: { cellWidth: z(16) },
        3: { cellWidth: z(16), halign: 'left' },
        4: { cellWidth: z(40) },
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
    };
  };

  // 曲名セルのテキスト幅(mm) = 本文幅 - 固定列(10+16+16+40) - 曲名セル左右パディング(2.5×2)、すべて×k
  const fit: TitleFit = {
    titles: s.songs.filter((r) => r.kind === 'song').map((r) => r.title).filter((t) => !!t),
    fontStyle: 'bold',
    baseSize: 20,
    textWidthAt: (k) => pageW - 2 * margin - (82 + 5) * k,
  };
  drawFitted(doc, autoTable, JsPDFCtor, fonts, pageW, startY, pageH - startY - bottom, makeOptions, fit);
}

// ステージ用の背景。ページ全面ではなく四隅に白フチ(FRAME)を残して黒シートを描く。
const FRAME = 6; // 白フチの幅(mm)

function paintBlack(doc: JsPDF, w: number, h: number): void {
  doc.setFillColor(...BLACK);
  doc.rect(FRAME, FRAME, w - FRAME * 2, h - FRAME * 2, 'F');
}

// ---- mono（印刷用・白地に黒、列名あり）--------------------------------------

function buildMono(doc: JsPDF, autoTable: AutoTable, JsPDFCtor: Ctor, s: Setlist, fonts: PdfFonts): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const startY = 33;
  const bottom = 15;

  // ヘッダは固定サイズ（伸縮は表のみ）
  doc.setFont(FONT, 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...BLACK);
  doc.text(s.title || 'セットリスト', margin, 22);
  doc.setFont(FONT, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(68, 68, 68);
  doc.text(metaLine(s), margin, 28);

  const makeBody = (k: number): unknown[] => {
    const z = (n: number) => +(n * k).toFixed(2);
    const body: unknown[] = [];
    let no = 0;
    for (const r of s.songs) {
      if (r.kind === 'encore') {
        body.push([
          {
            content: r.title || 'アンコール',
            colSpan: 5,
            styles: { halign: 'center', fontStyle: 'bold', fillColor: [238, 238, 238] },
          },
        ]);
        continue;
      }
      if (r.kind === 'mc') {
        body.push([
          {
            content: 'MC',
            styles: {
              fontStyle: 'bold',
              halign: 'center',
              overflow: 'visible',
              cellPadding: { top: z(1.8), bottom: z(1.8), left: z(0.5), right: z(0.5) },
            },
          },
          { content: r.title || 'MC', colSpan: 3, styles: { textColor: [85, 85, 85] } },
          { content: r.note, styles: { textColor: [85, 85, 85] } },
        ]);
        continue;
      }
      no += 1;
      body.push([String(no), r.title, r.key, formatDuration(r.duration_sec), r.note]);
    }
    return body;
  };

  const makeOptions = (k: number): TableOptions => {
    const z = (n: number) => +(n * k).toFixed(2);
    return {
      startY,
      margin: { left: margin, right: margin, top: 15, bottom },
      head: [['#', '曲名', 'Key', '時間', '備考']],
      body: makeBody(k),
      theme: 'plain',
      styles: {
        font: FONT,
        fontSize: z(11),
        textColor: BLACK,
        cellPadding: { top: z(1.8), bottom: z(1.8), left: z(1.5), right: z(1.5) },
        valign: 'middle',
        lineWidth: 0,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: BLACK,
        textColor: WHITE,
        fontSize: z(10),
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: z(8) },
        2: { cellWidth: z(16) },
        3: { cellWidth: z(18) },
        4: { cellWidth: z(45) },
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
    };
  };

  // 曲名セルのテキスト幅(mm) = 本文幅 - 固定列(8+16+18+45) - 曲名セル左右パディング(1.5×2)、すべて×k
  const fit: TitleFit = {
    titles: s.songs.filter((r) => r.kind === 'song').map((r) => r.title).filter((t) => !!t),
    fontStyle: 'normal',
    baseSize: 11,
    textWidthAt: (k) => pageW - 2 * margin - (87 + 3) * k,
  };
  drawFitted(doc, autoTable, JsPDFCtor, fonts, pageW, startY, pageH - startY - bottom, makeOptions, fit);
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
