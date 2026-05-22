# Fukunishi Farm Architecture

## 目的

- 既存サイトの掲載内容を減らさずに、モダンな見た目へ更新する
- ブログ機能追加の前提として、フロントと API を分離した基盤を作る
- ローカル起動、Vercel、Railway の運用を分けやすくする

## 全体構成

- `Next.js` はサイト本体を担当する
- `Go` はまず health check API のみを担当する
- `Docker Compose` で web / api をローカル起動する

## フロントエンド

- ページは App Router で構成する
- 既存のページ構成は維持する
- デザインはカード、グリッド、ガラス調のヘッダーで統一する
- 主要ページ
  - `/`
  - `/about`
  - `/news`
  - `/price`
  - `/reservation`
  - `/access`
  - `/contact`
  - `/download`
  - `/tirashi`

## バックエンド

- `Echo` を HTTP サーバーとして使う
- `Echo` で `/healthz` を返す
- DB アクセスはまだ実装しない
- 現時点の API
  - `GET /healthz`

## 起動手順

- `make dev` で Docker Compose を起動する
- `web` は `frontend/Dockerfile`
- `api` は `backend/Dockerfile`

## フロントエンドの役割

- フロントエンドは DB に直接アクセスしない
- フロントエンドは backend の API を fetch して表示する
- 将来のブログ画面も API 経由で取得する

## デプロイ

- `Vercel` は Next.js のみをデプロイする
- `Railway` は Go API を扱う
- Railway 側では `CORS_ALLOW_ORIGINS` を設定する

## 懸念事項

- Vercel と Railway が別ドメインになるため、CORS 設定を本番用に調整する必要がある
