# セットリスト管理アプリ ベータ版 (setlist-beta)

## プロジェクト概要

バンドマン向けのセットリスト管理Webアプリの**ベータ版**。
**完全フロント完結・バックエンドなし**の静的SPAで、GitHub Pages に公開する。

> フルスタック版（FastAPI / Supabase / 認証）は別リポジトリ `setlist-app` で開発する。
> このリポジトリはそこから派生した、静的公開専用のベータ版。

## 主な機能

- セットリストの作成・編集・保存（localStorage に自動保存）
- ライブ用PDF出力（蛍光色モード・白黒モード）— ブラウザ印刷で生成
- 曲の管理（盛り上がり・備考などのステータス、MC/アンコール行）

## 技術スタック

- フロントエンド: Angular 22 / Angular Material / Tailwind CSS
- データ保持: ブラウザ localStorage（サーバー保存なし）
- PDF生成: クライアント側でHTML/CSSを組み立て、ブラウザ印刷（`window.print`）で出力
- ホスティング: GitHub Pages（`.github/workflows/deploy.yml` で自動デプロイ）

## ディレクトリ構成

- `/frontend` - Angularプロジェクト（このリポジトリの本体）
- `/.github/workflows/deploy.yml` - GitHub Pages デプロイ

## アーキテクチャ方針

- **データはクライアントの localStorage に保持する（ユーザーごとに独立・使い切り）**。
  サーバーは存在しない（完全ステートレス）。リロードにも耐える。
  - localStorage が空のときはサンプル（入力例）から開始する（`SetlistService`）
  - 将来、複数端末同期やチーム共有が必要になったらフルスタック版 `setlist-app` 側で対応する
- **PDFはバックエンドを使わずクライアントで生成する**。
  - `frontend/src/app/core/pdf-html.ts` が color/mono のHTML/CSSを組み立てる
    （もとは backend の WeasyPrint テンプレートを移植したもの）
  - プレビューダイアログの iframe をそのまま `window.print()` し、ユーザーが「PDFに保存」
- **認証ゲートなし（オープンベータ）**。ログイン画面・authGuard は撤去済み。

## デプロイ規約

- `main` への push で GitHub Actions がビルド & GitHub Pages へ公開
- 公開URL: `https://<ユーザー名>.github.io/setlist-beta/`
- base-href は `/setlist-beta/`（`npm run build:pages`）。リポジトリ名を変える場合は
  `frontend/package.json` の `build:pages` と workflow の双方を合わせる
- SPA フォールバックのため `index.html` を `404.html` にコピー、`.nojekyll` を配置（workflow内で実施）

## 開発ルール

- API は持たない（静的フロントのみ）
- コメントは日本語でOK
- コミットメッセージは日本語でOK

## Skills

### フロントエンドデザイン

- Path: `~/.claude/skills/frontend-design/SKILL.md`
- 用途: UIコンポーネント・デザインシステムの設計・実装全般
- トリガー: ボタン・フォーム・カード・レイアウトの作成、カラーパレット設定、ダークモード対応、「見た目をよくして」などのデザイン関連リクエスト
- **汎用skill**: カラーパレットを含むすべての設定はプロジェクト指定がない場合のデフォルト。
- プロジェクト固有のデザイン仕様がある場合は、`<プロジェクトroot>/.claude/skills/frontend-design/SKILL.md` を用意してそちらで上書きする。
