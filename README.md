# setlist-beta

バンドマン向けのセットリスト管理Webアプリ（**ベータ版**）。

### 🔗 https://asahi73.github.io/setlist-beta/

バックエンド不要の静的SPA。データはブラウザの localStorage に保持し、PDFはブラウザ印刷で出力する。
（フルスタック版は別リポジトリ `setlist-app` で開発）

## 主な機能

- セットリストの作成・編集（localStorage に自動保存）
- ライブ用PDF出力（蛍光色モード・白黒モード）— ブラウザの印刷 → 「PDFに保存」で出力
- 曲の管理（盛り上がり・備考などのステータス、MC/アンコール行）

## 技術スタック

Angular 22 / Angular Material / Tailwind CSS。データ保持は localStorage、ホスティングは GitHub Pages。

## ローカル開発

```bash
cd frontend
npm install
npm start        # http://localhost:4200
```

`main` に push すると GitHub Actions が自動でビルド・公開する。
公開・base-href・デプロイの仕組みは [CLAUDE.md](./CLAUDE.md) を参照。
