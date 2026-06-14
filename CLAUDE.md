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
- PDF生成: jsPDF + autoTable によるクライアント生成（`window.print` 不採用）
- ホスティング: GitHub Pages（`.github/workflows/deploy.yml` で自動デプロイ）

## ディレクトリ構成

```
/frontend/src/app/
  core/            # アプリ全体で使うモデル・サービス（models.ts, setlist.service.ts など）
  layout/
    header/        # グローバルヘッダー（Header コンポーネント）
  shared/
    primary-button/  # appPrimaryButton ディレクティブ（「青 = プライマリのみ」強制）
  features/
    setlist-editor/
      setlist-toolbar/   # ツールバー（追加・リセット・PDF出力ボタン群）
      song-list/         # 曲リスト（PC テーブル + モバイルカード）
      pdf-preview-dialog/  # PDF プレビューダイアログ
      pdf.ts             # PDF 生成ロジック（buildSetlistPdfDoc / generateSetlistPdf）
      duration.ts        # 演奏時間計算ユーティリティ
      setlist-editor.ts  # 親エディタ（フォーム管理・状態制御のみ）
```

- `/.github/workflows/deploy.yml` - GitHub Pages デプロイ

## アーキテクチャ方針

- **データはクライアントの localStorage に保持する（ユーザーごとに独立・使い切り）**。
  サーバーは存在しない（完全ステートレス）。リロードにも耐える。
  - localStorage が空のときはサンプル（入力例）から開始する（`SetlistService`）
  - 将来、複数端末同期やチーム共有が必要になったらフルスタック版 `setlist-app` 側で対応する
- **PDFはバックエンドを使わずクライアントで「本物のPDF」を生成する**（jsPDF + autoTable）。
  - `frontend/src/app/features/setlist-editor/pdf.ts` が color/mono を組み立てて Blob を返す
    - `buildSetlistPdfDoc(...)` は jsPDF/autoTable を引数で受け取る純粋関数（node でテスト可能）
    - `generateSetlistPdf(...)` がブラウザ用ラッパー。jsPDF/autoTable と日本語フォントを**遅延ロード**
  - 日本語フォント Noto Sans JP Regular/Bold を `frontend/public/fonts/*.ttf` に配置し、
    PDF生成時のみ fetch → base64 で jsPDF に登録（初期表示には影響しない）
  - **`window.print()` 方式は不採用**。印刷ダイアログ依存（ヘッダ/フッタ混入・背景未印刷・
    Safariのiframe印刷不具合・倍率依存）で全環境一致の出力にならないため
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

## フロントエンド設計規約

### コンポーネント命名（Angular 公式新スタイル）

- ファイル名・クラス名から `.component` サフィックスを省略する（公式推奨）
  - 例: `setlist-editor.ts` / `export class SetlistEditor {}`
- コンポーネントは **1 コンポーネント 1 サブディレクトリ**（`.ts` `.html` `.scss` `.spec.ts` をまとめる）
- 単一ファイルのユーティリティ（`pdf.ts`, `duration.ts`）はサブディレクトリ不要、フィーチャールートに置く

### レイヤー分け

| レイヤー | 役割 |
|---------|------|
| `core/` | 型定義・サービス（全フィーチャー共有） |
| `layout/` | ページ骨格（ヘッダー等）。すべてのルートで自動表示 |
| `shared/` | 再利用ディレクティブ・パイプ（特定フィーチャーに依存しない） |
| `features/` | ページ単位のフィーチャーモジュール |

### `appPrimaryButton` ディレクティブ

- セレクター: `button[appPrimaryButton]`
- ホストクラス `.app-primary-btn` を付与し、グローバル `styles.scss` でスタイルを一元管理
- 「青いボタン = プライマリアクションのみ」を強制する。それ以外は `mat-stroked-button` や `mat-icon-button` を使う

### Reactive Forms と子コンポーネント

- `SongList` は親フォームに依存しない設計にする
- 各行 (`FormGroup`) を `[formGroup]="row"` で直接バインドし、`formArrayName` / `formGroupName` は不使用
- `expandedRows` など親の状態は `input()` で渡し、変更は `output()` で通知する（一方向データフロー）

### テスト規約

- テストランナー: vitest（`@angular/build:unit-test`）
- **AAA パターン**（Arrange / Act / Assert）を各 `it` ブロックに日本語コメントで明記する
- 共通セットアップは `beforeEach` に、テスト固有の準備は各 `it` の Arrange 節に書く
- ファクトリ関数でテストデータを組み立て、`it` の Arrange を短くする
