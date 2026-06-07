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

## 開発ルール

- フロントとバックエンドはモノレポ構成
- APIはREST
- コメントは日本語でOK
- コミットメッセージは日本語でOK
