# セットリスト管理アプリ (setlist-app)

## プロジェクト概要

バンドマン向けのセットリスト管理Webアプリ

## 主な機能

- セットリストの作成・編集・保存
- ライブ用PDF出力（蛍光色モード・白黒モード）
- 曲の管理（採用回数・タグ・盛り上がりなどのステータス）
- ユーザー認証（Supabase Auth）

## 技術スタック

- フロントエンド: Angular 22 / Angular Material / Tailwind CSS
- バックエンド: Python / FastAPI / Poetry
- DB: Supabase (PostgreSQL)
- 認証: Supabase Auth
- PDF生成: WeasyPrint
- ローカル開発: Docker Compose
- フロントホスティング: Vercel
- バックエンドホスティング: Render

## ディレクトリ構成

- `/frontend` - Angularプロジェクト
- `/backend` - FastAPIプロジェクト

## アーキテクチャ方針

- **データはクライアントの localStorage に保持する（ユーザーごとに独立・使い切り）**。
  サーバーはセットリストを保存しない（ステートレス）。これにより全員が同じデータを触ってしまう問題を回避し、リロードにも耐える。
  - localStorage が空のときはサンプル（入力例）から開始する
  - 将来、複数端末同期やチーム共有が必要になったら Supabase(PostgreSQL) をサーバー側ストレージとして再導入する
- バックエンドの責務は **認証** と **PDF生成** のみ。
  - PDFは「サーバー保存値」ではなく、リクエストボディで受け取ったセットリストから生成する
- 認証は当面「全ユーザー共通の秘密パスワード1つ」の簡易ゲート（`APP_PASSWORD`→`APP_TOKEN`をBearerで検証）。後でSupabase Authに差し替える

## API規約

- ベースパスは `/api`
- 認証: `POST /api/auth/login` でトークン取得 → 以降 `Authorization: Bearer <token>`
- PDF生成: `POST /api/setlist/pdf?mode=color|mono`（ボディに編集中のセットリストを送る）

## 開発ルール

- フロントとバックエンドはモノレポ構成
- APIはREST
- コメントは日本語でOK
- コミットメッセージは日本語でOK

## Skills

### フロントエンドデザイン

- Path: `~/.claude/skills/frontend-design/SKILL.md`
- 用途: UIコンポーネント・デザインシステムの設計・実装全般
- トリガー: ボタン・フォーム・カード・レイアウトの作成、カラーパレット設定、ダークモード対応、「見た目をよくして」などのデザイン関連リクエスト
- **汎用skill**: カラーパレットを含むすべての設定はプロジェクト指定がない場合のデフォルト。
- プロジェクト固有のデザイン仕様がある場合は、`<プロジェクトroot>/.claude/skills/frontend-design/SKILL.md` を用意してそちらで上書きする。
