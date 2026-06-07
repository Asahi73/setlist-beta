"""セットリストのPDF生成（WeasyPrint）。

2モード:
- color: 白フチ＋背景黒、文字は蛍光イエロー＋白のみ。列名なし。曲名/key/時間/備考。
         ステージ上で視認しやすいライブ用。
- mono : 白地に黒文字、列名あり。印刷向き。
"""

from html import escape

from .models import Setlist

_NEON_YELLOW = "#EBFF00"
# 日本語フォント（Dockerで fonts-noto-cjk を導入）
_FONT = "'Noto Sans CJK JP','Noto Sans JP',sans-serif"


def _format_duration(sec: int) -> str:
    if sec <= 0:
        return ""
    return f"{sec // 60}:{sec % 60:02d}"


def _song_count(setlist: Setlist) -> int:
    # 曲のみカウント（MC・アンコール見出しは除外）
    return sum(1 for s in setlist.songs if s.kind == "song")


def _total_duration(setlist: Setlist) -> str:
    # 曲のみ合計（MC・アンコール見出しは除外）
    total = sum(
        s.duration_sec
        for s in setlist.songs
        if s.kind == "song" and s.duration_sec > 0
    )
    return _format_duration(total) if total > 0 else "-"


def _excitement_stars(level: int) -> str:
    if level <= 0:
        return ""
    return "★" * level + "☆" * (5 - level)


def _meta_line(setlist: Setlist) -> str:
    parts = []
    if setlist.slot_time.strip():
        parts.append(f"持ち時間 {escape(setlist.slot_time)}")
    parts.append(f"全{_song_count(setlist)}曲")
    parts.append(f"演奏 {_total_duration(setlist)}")
    return " / ".join(parts)


# ---- color（ステージ用）------------------------------------------------------

def _color_rows(setlist: Setlist) -> str:
    rows = []
    song_no = 0
    for row in setlist.songs:
        if row.kind == "encore":
            label = escape(row.title) or "アンコール"
            rows.append(f'<tr class="encore"><td colspan="5">{label}</td></tr>')
            continue
        if row.kind == "mc":
            content = escape(row.title) or "MC"
            rows.append(
                '<tr class="mc">'
                '<td class="num">MC</td>'
                f'<td class="title" colspan="3">{content}</td>'
                f'<td class="note">{escape(row.note)}</td>'
                "</tr>"
            )
            continue
        song_no += 1
        rows.append(
            "<tr>"
            f'<td class="num">{song_no}</td>'
            f'<td class="title">{escape(row.title)}</td>'
            f'<td class="key">{escape(row.key)}</td>'
            f'<td class="dur">{_format_duration(row.duration_sec)}</td>'
            f'<td class="note">{escape(row.note)}</td>'
            "</tr>"
        )
    return "\n".join(rows)


def _color_html(setlist: Setlist) -> str:
    title = escape(setlist.title) or "セットリスト"
    css = f"""
    @page {{ size: A4 portrait; margin: 6mm; }}
    html, body {{ height: 100%; margin: 0; }}
    body {{
      background: #000; color: #fff; box-sizing: border-box;
      padding: 7mm 10mm;
      font-family: {_FONT};
    }}
    .head {{ margin-bottom: 4mm; }}
    .head .title {{ color: {_NEON_YELLOW}; font-size: 26pt; font-weight: bold; }}
    .head .meta {{ color: #fff; font-size: 12pt; margin-top: 1.5mm; }}
    table {{ width: 100%; border-collapse: collapse; }}
    td {{ padding: 2.6mm 3mm; border-bottom: 1px solid #333; font-size: 17pt; vertical-align: baseline; }}
    td.num {{ color: #fff; width: 9mm; font-size: 14pt; }}
    td.title {{ color: {_NEON_YELLOW}; font-weight: bold; font-size: 23pt; }}
    td.key, td.dur {{ color: #fff; white-space: nowrap; }}
    td.note {{ color: #fff; font-size: 11pt; }}
    tr.mc td {{ color: #fff; font-style: italic; font-size: 13pt; }}
    tr.mc td.num {{ color: #fff; font-style: normal; font-weight: bold; }}
    tr.encore td {{
      color: {_NEON_YELLOW}; font-weight: bold; text-align: center;
      font-size: 15pt; letter-spacing: 0.3em; padding: 2.4mm;
      border-top: 2px solid {_NEON_YELLOW}; border-bottom: 2px solid {_NEON_YELLOW};
    }}
    """
    return f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><style>{css}</style></head>
<body>
  <div class="head">
    <div class="title">{title}</div>
    <div class="meta">{_meta_line(setlist)}</div>
  </div>
  <table><tbody>
{_color_rows(setlist)}
  </tbody></table>
</body></html>"""


# ---- mono（印刷用）----------------------------------------------------------

def _mono_rows(setlist: Setlist) -> str:
    rows = []
    song_no = 0
    for row in setlist.songs:
        if row.kind == "encore":
            label = escape(row.title) or "アンコール"
            rows.append(f'<tr class="encore"><td colspan="6">{label}</td></tr>')
            continue
        if row.kind == "mc":
            content = escape(row.title) or "MC"
            rows.append(
                '<tr class="mc">'
                '<td class="num">MC</td>'
                f'<td class="title" colspan="4">{content}</td>'
                f'<td class="note">{escape(row.note)}</td>'
                "</tr>"
            )
            continue
        song_no += 1
        rows.append(
            "<tr>"
            f'<td class="num">{song_no}</td>'
            f'<td class="title">{escape(row.title)}</td>'
            f'<td class="key">{escape(row.key)}</td>'
            f'<td class="dur">{_format_duration(row.duration_sec)}</td>'
            f'<td class="exc">{_excitement_stars(row.excitement)}</td>'
            f'<td class="note">{escape(row.note)}</td>'
            "</tr>"
        )
    return "\n".join(rows)


def _mono_html(setlist: Setlist) -> str:
    title = escape(setlist.title) or "セットリスト"
    css = """
    @page { size: A4 portrait; margin: 15mm; }
    body { color:#000; font-family:__FONT__; }
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
    """.replace("__FONT__", _FONT)
    return f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><style>{css}</style></head>
<body>
  <h1>{title}</h1>
  <div class="meta">{_meta_line(setlist)}</div>
  <table>
    <thead><tr>
      <th>#</th><th>曲名</th><th>Key</th><th>時間</th><th>盛り上がり</th><th>備考</th>
    </tr></thead>
    <tbody>
{_mono_rows(setlist)}
    </tbody>
  </table>
</body></html>"""


def build_html(setlist: Setlist, mode: str) -> str:
    if mode == "color":
        return _color_html(setlist)
    return _mono_html(setlist)


def render_pdf(setlist: Setlist, mode: str = "mono") -> bytes:
    # weasyprint はネイティブ依存（pango等）を読み込むため遅延import。
    # ライブラリ未導入の環境でもアプリ自体は起動できるようにする。
    from weasyprint import HTML

    mode = "color" if mode == "color" else "mono"
    return HTML(string=build_html(setlist, mode)).write_pdf()
