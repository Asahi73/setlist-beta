# setlist-app

バンドマン向けのセットリスト管理Webアプリ。

## 主な機能

- セットリストの作成・編集・保存
- ライブ用PDF出力（蛍光色モード・白黒モード）
- 曲の管理（採用回数・タグ・盛り上がりなどのステータス）
- ユーザー認証（Supabase Auth）

## 技術スタック

| 領域 | 技術 |
|---|---|
| フロントエンド | Angular 22 / Angular Material / Tailwind CSS |
| バックエンド | Python / FastAPI / Poetry |
| DB | Supabase (PostgreSQL) |
| 認証 | Supabase Auth |
| PDF生成 | WeasyPrint |
| ローカル開発 | Docker Compose |

## ディレクトリ構成

```
setlist-app/
├── frontend/   # Angular プロジェクト
├── backend/    # FastAPI プロジェクト
└── docker-compose.yml
```

## セットアップ

### 1. 環境変数の設定

バックエンドの `.env` を作成し、Supabase の接続情報を設定します。

```bash
cp backend/.env.example backend/.env
# backend/.env を開いて SUPABASE_URL / SUPABASE_KEY を実際の値に書き換える
```

### 2. Docker で起動（推奨）

```bash
docker compose up --build
```

- フロントエンド: http://localhost:4200
- バックエンド: http://localhost:8000
- ヘルスチェック: http://localhost:8000/health

## ローカル開発（Docker を使わない場合）

### フロントエンド

```bash
cd frontend
npm install
npm start        # http://localhost:4200
```

### バックエンド

```bash
cd backend
poetry install
PYTHONPATH=src poetry run uvicorn backend.main:app --reload   # http://localhost:8000
```

## 開発ルール

- フロントとバックエンドはモノレポ構成
- API は REST
- コメント・コミットメッセージは日本語でOK
