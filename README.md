# setlist-beta

バンドマン向けのセットリスト管理Webアプリ（**ベータ版 / 完全フロント完結・バックエンド不要**）。

GitHub Pages で公開する静的SPA。データはブラウザの localStorage に保持し、PDFはブラウザ印刷で生成する。
（フルスタック版・将来のチーム共有版は別リポジトリ `setlist-app` で開発）

## 主な機能

- セットリストの作成・編集・保存（localStorage に自動保存）
- ライブ用PDF出力（蛍光色モード・白黒モード）— ブラウザの印刷 → 「PDFに保存」で出力
- 曲の管理（盛り上がり・備考などのステータス、MC/アンコール行）

## 技術スタック

| 領域 | 技術 |
|---|---|
| フロントエンド | Angular 22 / Angular Material / Tailwind CSS |
| データ保持 | ブラウザ localStorage（サーバー保存なし） |
| PDF生成 | クライアント側でHTML/CSSを組み立て、ブラウザ印刷で出力 |
| ホスティング | GitHub Pages |

> ベータ版にバックエンド（FastAPI / DB / 認証）は含まれません。

## ディレクトリ構成

```
setlist-beta/
├── frontend/                  # Angular プロジェクト
└── .github/workflows/deploy.yml  # GitHub Pages 自動デプロイ
```

## ローカル開発

```bash
cd frontend
npm install
npm start        # http://localhost:4200
```

## 公開（GitHub Pages）

`main` に push すると GitHub Actions が自動でビルド・デプロイする。

- 公開URL: `https://<ユーザー名>.github.io/setlist-beta/`
- base-href は `/setlist-beta/`（`npm run build:pages`）。リポジトリ名を変える場合は
  `frontend/package.json` の `build:pages` と `.github/workflows/deploy.yml` を合わせて変更する。

初回のみ GitHub リポジトリの **Settings → Pages → Build and deployment → Source** を
**GitHub Actions** に設定する。

## 開発ルール

- API は持たない（静的フロントのみ）
- コメント・コミットメッセージは日本語でOK
