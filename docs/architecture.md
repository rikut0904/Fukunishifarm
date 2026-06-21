# Fukunishi Farm Architecture

## 目的

- 既存サイトの掲載内容を減らさずに、モダンな見た目へ更新する
- フロントと API を分離し、将来のブログ機能を追加しやすくする
- Firebase 関連処理は backend に集約し、管理者ログインを backend 経由で行う
- 管理者情報とセッションは Railway PostgreSQL に保存する
- ローカル起動、Vercel、Railway の運用を分けやすくする

## 全体構成

- `frontend/` は Next.js のサイト本体
- `backend/` は Echo + Huma + GORM の API
- `docker-compose.yml` で web / api をローカル起動する
- DB はローカルでは持たず、Railway PostgreSQL を利用する
- frontend は `NEXT_PUBLIC_API_BASE_URL` をブラウザ向け API の参照先として使い、`API_INTERNAL_BASE_URL` は Docker 内部での backend 参照に使う

## フロントエンド

- App Router で構成する
- 既存のページ構成は維持する
- モバイルでは画像群をカルーセル表示にする
- 管理者ページは `/admin`
- 認証 UI は frontend に置くが、Firebase 認証の実処理は backend が担う
- frontend は backend の `/v1/auth/login` と `/v1/auth/session` だけを使う
- frontend は Firebase SDK を直接持たない
- フロントエンドは DB に直接アクセスしない

## バックエンド

- Echo を HTTP サーバーとして使う
- Huma で API を定義し、OpenAPI も出せるようにする
- GORM で Railway PostgreSQL にアクセスする
- Firebase Admin SDK で ID トークンを検証する
- Firebase Web API でメールアドレスとパスワードのログインを backend から行う
- Firebase Admin SDK で新規ユーザー作成を backend から行う
- backend が管理者用セッション JWT を発行する
- クリーンアーキテクチャの責務分離
  - domain: エンティティとインターフェース
  - usecase: 認証のユースケース
  - infra: Firebase / JWT / GORM 実装
  - transport: HTTP ルーティング
- 現時点の API
  - `GET /healthz`
  - `POST /v1/auth/login`
  - `GET /v1/auth/session`
  - `POST /v1/admin/users`

## 認証フロー

1. 管理者が frontend の `/admin` 画面でメールアドレスとパスワードを入力する
2. frontend が backend の `/v1/auth/login` に送信する
3. backend が Firebase Web API で認証する
4. backend が Firebase Admin SDK で ID トークンを検証する
5. backend がユーザー情報を Railway PostgreSQL に upsert する
6. backend が管理者セッション JWT と管理者情報を返す
7. frontend はセッション JWT を保持し、`/v1/auth/session` で現在の管理者情報を取得する
8. 管理画面に入ったユーザーは backend の `/v1/admin/users` から新規ユーザーを作成できる

## 起動手順

- `make start` で Docker Compose を起動する
- `frontend` は `frontend/Dockerfile`
- `backend` は `backend/Dockerfile`

## デプロイ

- `Vercel` は Next.js のみをデプロイする
- `Railway` は Go API と PostgreSQL を扱う
- Railway 側では `DATABASE_URL`、`FIREBASE_PROJECT_ID`、`FIREBASE_SERVICE_ACCOUNT_JSON`、`FIREBASE_API_KEY`、`SESSION_JWT_SECRET`、`AWS_REGION`、`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`、`AWS_SESSION_TOKEN`、`SES_FROM_EMAIL` を設定する
- DB migration と Lolipop へのデプロイは GitHub Actions を手動実行する
- 実行順は `Migrate on main` を先に実行し、完了後に `Deploy to Lolipop on main` を実行する
- どちらも GitHub Actions の `workflow_dispatch` から起動する

## 懸念事項

- Vercel と Railway が別ドメインになるため、`CORS_ALLOW_ORIGINS` を本番用に調整する必要がある
- frontend はセッション JWT をどこに保存するかの方針が必要で、現状は localStorage を使っている
- 管理画面からのユーザー作成を許可するので、操作権限が必要な場合は session JWT の保護強化を検討する
