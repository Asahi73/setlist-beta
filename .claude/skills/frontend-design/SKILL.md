---
name: frontend-design
description: >
  プロジェクト固有のフロントエンドデザインskill。汎用版（~/.claude/skills/frontend-design）を
  このプロジェクトのカラールールで上書きする。背景は白/黒、青はプライマリアクションのみに限定。
  UIコンポーネントの実装・スタイリング・デザインシステム整備の際に使用する。
---

# Frontend Design — プロジェクト設定

汎用skillのルール（タイポグラフィ・スペーシング・コンポーネント構造）をすべて継承する。
**このファイルはカラーシステムとその運用ルールのみを上書きする。**

---

## カラー原則

このプロジェクトのカラーは**モノクロ + 青1色**で構成する。

- 背景・サーフェス・テキスト・ボーダーはすべてモノクロ（白〜黒のグレースケール）
- 青は**プライマリボタンとフォーカスリングのみ**に使う
- 1画面に青が複数箇所現れる場合は設計を疑う。青が2つ以上あるなら、どちらかを secondary（モノクロ）に格下げする

青の役割は「ここが唯一の次のアクション」を示すこと。背景に溶け込むほど控えめに、しかし押すべきボタンは迷わずわかる、そのバランスを保つ。

---

## カラートークン

```css
:root {
  /* --- Surfaces (モノクロ) --- */
  --color-bg: #ffffff;
  --color-surface: #fafafa;
  --color-surface-alt: #f4f4f5;
  --color-overlay: #e4e4e7;

  /* --- Text (モノクロ) --- */
  --color-text: #09090b;
  --color-text-muted: #71717a;
  --color-text-subtle: #a1a1aa;
  --color-text-on-primary: #ffffff;

  /* --- Borders (モノクロ) --- */
  --color-border: #e4e4e7;
  --color-border-strong: #d4d4d8;
  --color-border-focus: #2563eb; /* ← 青はここだけ */

  /* --- Primary = 青 (使用箇所を絞ること) --- */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-subtle: #eff6ff; /* バッジ・選択状態の薄い背景のみ */

  /* --- Semantic (変更なし) --- */
  --color-danger: #ef4444;
  --color-danger-hover: #dc2626;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
}

[data-theme='dark'] {
  /* --- Surfaces --- */
  --color-bg: #000000;
  --color-surface: #0f0f0f;
  --color-surface-alt: #171717;
  --color-overlay: #262626;

  /* --- Text --- */
  --color-text: #fafafa;
  --color-text-muted: #a1a1aa;
  --color-text-subtle: #71717a;
  --color-text-on-primary: #ffffff;

  /* --- Borders --- */
  --color-border: #262626;
  --color-border-strong: #3f3f46;
  --color-border-focus: #3b82f6;

  /* --- Primary --- */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-primary-subtle: #0f1f3d;

  /* --- Semantic --- */
  --color-danger: #f87171;
  --color-danger-hover: #fca5a5;
  --color-success: #4ade80;
  --color-warning: #fbbf24;
}
```

---

## 青の使用ルール

**使っていい場所:**

- `.btn-primary` の背景色
- `focus-visible` のアウトライン（`--color-border-focus`）
- インタラクティブカードの selected 状態のボーダー
- フォームのフォーカスボーダー + フォーカスリング

**使ってはいけない場所:**

- ナビバー・サイドバーの背景や装飾
- セクション見出し・ラベル
- バッジ・タグ（`--color-primary-subtle` の薄い背景は例外的にOKだが乱用しない）
- アイコンのデフォルト色
- secondary ボタン・ghost ボタン（これらはモノクロで表現する）

---

## ボタンの青の扱い方

プライマリボタンのみ青を使う。それ以外はモノクロに徹する。

```css
/* Primary — 青 (1画面に原則1つ) */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  border-color: transparent;
}
.btn-primary:hover {
  background: var(--color-primary-hover);
}

/* Secondary — モノクロ */
.btn-secondary {
  background: transparent;
  color: var(--color-text);
  border-color: var(--color-border-strong);
}
.btn-secondary:hover {
  background: var(--color-overlay);
}

/* Ghost — モノクロ */
.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
  border-color: transparent;
}
.btn-ghost:hover {
  background: var(--color-overlay);
  color: var(--color-text);
}
```

---

## 継承元

タイポグラフィ・スペーシング・シャドウ・カード・フォーム・レイアウトのすべてのルールは
汎用skill（`~/.claude/skills/frontend-design/SKILL.md`）に従う。
