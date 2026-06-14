// セットリストの印刷用HTMLを生成する（クライアント完結・バックエンド不要）。
//
// もとは backend/src/backend/pdf.py が WeasyPrint に渡していたHTML/CSSを
// そのままブラウザの印刷（window.print → PDFとして保存）向けに移植したもの。
//
// 2モード:
// - color: 背景黒＋蛍光イエロー＋白。列名なし。ステージ上で視認しやすいライブ用。
// - mono : 白地に黒文字、列名あり。印刷向き。

import { PdfMode, Setlist } from './models';

const NEON_YELLOW = '#EBFF00';
// 日本語フォント（端末にあるものを順に使う）
const FONT = "'Noto Sans CJK JP','Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDuration(sec: number): string {
  if (sec <= 0) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// 曲のみカウント（MC・アンコール見出しは除外）
function songCount(setlist: Setlist): number {
  return setlist.songs.filter((s) => s.kind === 'song').length;
}

// 曲のみ合計（MC・アンコール見出しは除外）
function totalDuration(setlist: Setlist): string {
  const total = setlist.songs
    .filter((s) => s.kind === 'song' && s.duration_sec > 0)
    .reduce((sum, s) => sum + s.duration_sec, 0);
  return total > 0 ? formatDuration(total) : '-';
}

function excitementStars(level: number): string {
  if (level <= 0) return '';
  return '★'.repeat(level) + '☆'.repeat(5 - level);
}

function metaLine(setlist: Setlist): string {
  const parts: string[] = [];
  if (setlist.slot_time.trim()) {
    parts.push(`持ち時間 ${escapeHtml(setlist.slot_time)}`);
  }
  parts.push(`全${songCount(setlist)}曲`);
  parts.push(`演奏 ${totalDuration(setlist)}`);
  return parts.join(' / ');
}

// ---- color（ステージ用）------------------------------------------------------

function colorRows(setlist: Setlist): string {
  const rows: string[] = [];
  let songNo = 0;
  for (const row of setlist.songs) {
    if (row.kind === 'encore') {
      const label = escapeHtml(row.title) || 'アンコール';
      rows.push(`<tr class="encore"><td colspan="5">${label}</td></tr>`);
      continue;
    }
    if (row.kind === 'mc') {
      const content = escapeHtml(row.title) || 'MC';
      rows.push(
        '<tr class="mc">' +
          '<td class="num">MC</td>' +
          `<td class="title" colspan="3">${content}</td>` +
          `<td class="note">${escapeHtml(row.note)}</td>` +
          '</tr>',
      );
      continue;
    }
    songNo += 1;
    rows.push(
      '<tr>' +
        `<td class="num">${songNo}</td>` +
        `<td class="title">${escapeHtml(row.title)}</td>` +
        `<td class="key">${escapeHtml(row.key)}</td>` +
        `<td class="dur">${formatDuration(row.duration_sec)}</td>` +
        `<td class="note">${escapeHtml(row.note)}</td>` +
        '</tr>',
    );
  }
  return rows.join('\n');
}

function colorHtml(setlist: Setlist): string {
  const title = escapeHtml(setlist.title) || 'セットリスト';
  const css = `
    @page { size: A4 portrait; margin: 6mm; }
    html, body { height: 100%; margin: 0; }
    body {
      background: #000; color: #fff; box-sizing: border-box;
      padding: 7mm 10mm;
      font-family: ${FONT};
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .head { margin-bottom: 4mm; }
    .head .title { color: ${NEON_YELLOW}; font-size: 26pt; font-weight: bold; }
    .head .meta { color: #fff; font-size: 12pt; margin-top: 1.5mm; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2.6mm 3mm; border-bottom: 1px solid #333; font-size: 17pt; vertical-align: baseline; }
    td.num { color: #fff; width: 9mm; font-size: 14pt; }
    td.title { color: ${NEON_YELLOW}; font-weight: bold; font-size: 23pt; }
    td.key, td.dur { color: #fff; white-space: nowrap; }
    td.note { color: #fff; font-size: 11pt; }
    tr.mc td { color: #fff; font-style: italic; font-size: 13pt; }
    tr.mc td.num { color: #fff; font-style: normal; font-weight: bold; }
    tr.encore td {
      color: ${NEON_YELLOW}; font-weight: bold; text-align: center;
      font-size: 15pt; letter-spacing: 0.3em; padding: 2.4mm;
      border-top: 2px solid ${NEON_YELLOW}; border-bottom: 2px solid ${NEON_YELLOW};
    }
  `;
  return `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head>
<body>
  <div class="head">
    <div class="title">${title}</div>
    <div class="meta">${metaLine(setlist)}</div>
  </div>
  <table><tbody>
${colorRows(setlist)}
  </tbody></table>
</body></html>`;
}

// ---- mono（印刷用）----------------------------------------------------------

function monoRows(setlist: Setlist): string {
  const rows: string[] = [];
  let songNo = 0;
  for (const row of setlist.songs) {
    if (row.kind === 'encore') {
      const label = escapeHtml(row.title) || 'アンコール';
      rows.push(`<tr class="encore"><td colspan="6">${label}</td></tr>`);
      continue;
    }
    if (row.kind === 'mc') {
      const content = escapeHtml(row.title) || 'MC';
      rows.push(
        '<tr class="mc">' +
          '<td class="num">MC</td>' +
          `<td class="title" colspan="4">${content}</td>` +
          `<td class="note">${escapeHtml(row.note)}</td>` +
          '</tr>',
      );
      continue;
    }
    songNo += 1;
    rows.push(
      '<tr>' +
        `<td class="num">${songNo}</td>` +
        `<td class="title">${escapeHtml(row.title)}</td>` +
        `<td class="key">${escapeHtml(row.key)}</td>` +
        `<td class="dur">${formatDuration(row.duration_sec)}</td>` +
        `<td class="exc">${excitementStars(row.excitement)}</td>` +
        `<td class="note">${escapeHtml(row.note)}</td>` +
        '</tr>',
    );
  }
  return rows.join('\n');
}

function monoHtml(setlist: Setlist): string {
  const title = escapeHtml(setlist.title) || 'セットリスト';
  const css = `
    @page { size: A4 portrait; margin: 15mm; }
    body { color:#000; font-family:${FONT}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    h1 { font-size:22pt; margin:0 0 3mm; }
    .meta { color:#444; font-size:10pt; margin-bottom:5mm; }
    table { width:100%; border-collapse:collapse; }
    th,td { padding:2.5mm 2mm; border-bottom:1px solid #000; font-size:12pt; text-align:left; }
    th { background:#000; color:#fff; font-size:10pt; }
    td.num { width:7mm; }
    td.key,td.dur,td.exc { white-space:nowrap; }
    tr.mc td { color:#555; font-style:italic; }
    tr.mc td.num { color:#000; font-style:normal; font-weight:bold; }
    tr.encore td { background:#eee; font-weight:bold; text-align:center; letter-spacing:0.3em; }
  `;
  return `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head>
<body>
  <h1>${title}</h1>
  <div class="meta">${metaLine(setlist)}</div>
  <table>
    <thead><tr>
      <th>#</th><th>曲名</th><th>Key</th><th>時間</th><th>盛り上がり</th><th>備考</th>
    </tr></thead>
    <tbody>
${monoRows(setlist)}
    </tbody>
  </table>
</body></html>`;
}

export function buildPdfHtml(setlist: Setlist, mode: PdfMode): string {
  return mode === 'color' ? colorHtml(setlist) : monoHtml(setlist);
}
