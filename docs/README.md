# Fukunishi Farm

ふくにしファームの Web サイト基盤です。

## 構成

- フロントエンド: `frontend/` の Next.js
- バックエンド: `backend/` の Go + Echo
- デプロイ: Vercel(フロント) / Railway(API)

## ブログ

ブログ連携は Go API が microCMS を代理します。frontend から microCMS のキーは参照しません。

- backend の必要な環境変数: `MICROCMS_SERVICE_DOMAIN`, `MICROCMS_API_KEY`
- `MICROCMS_SERVICE_DOMAIN` には `fukunishifarm` のようなサービス名だけを入れます。`https://fukunishifarm.microcms.io/api/v1/` のようなフル URL は不要です。
- 任意の環境変数: `MICROCMS_BLOG_ENDPOINT` (`blogs` が既定値)
- 想定フィールド: `title`, `slug`, `excerpt`, `content`(HTML), `eyecatch`, `category`, `publishedAt`

microCMS 側で記事を作成・編集すると、backend の `/v1/blog` と `/v1/blog/{slug}` 経由で `/blog` と `/blog/[slug]` に反映されます。

ブログの公開機能は microCMS のみを参照するため、`/v1/blog` と `/v1/blog/{slug}` は database migration 未実行でも利用できます。他の DB 依存機能は引き続き migration が必要です。

## お知らせ

お知らせ連携も Go API が microCMS を代理します。frontend から microCMS のキーは参照しません。

- backend の必要な環境変数: `MICROCMS_SERVICE_DOMAIN`, `MICROCMS_API_KEY`
- 任意の環境変数: `MICROCMS_NEWS_ENDPOINT` (`news` が既定値)
- 想定フィールド: `title`

お知らせの公開機能は `/v1/news` を通じて microCMS から取得します。お知らせ管理画面は local 実装ではなく microCMS への導線だけを提供します。

## 起動

```bash
docker compose up --build
```

## GitHub Actions Secrets

CD を使う場合は、少なくとも以下を GitHub Secrets に設定します。

- Vercel
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
- Railway
  - `RAILWAY_TOKEN`
  - `RAILWAY_PROJECT_ID`
- Cloudflare
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CF_NEXT_PUBLIC_API_BASE_URL`
  - `CF_NEXT_PUBLIC_SITE_BASE_URL`
  - `CF_API_INTERNAL_BASE_URL` (必要な場合)

Railway backend は GitHub Actions から Railway CLI の `railway up --ci` でデプロイします。Railway の service 名が `backend` 以外の場合は、GitHub Actions Variables に `RAILWAY_SERVICE_NAME` を設定してください。

## CD Environment Mapping

- `preview`
  - Railway Preview
  - Vercel Preview
  - Trigger: `deploy-preview.yml` / Pull Request 更新時
- `staging`
  - Railway Staging
  - Vercel Production
  - Trigger: `deploy-staging.yml` / `main` への push / 手動実行
- `production`
  - Railway Production
  - Cloudflare Production
  - Trigger: `deploy-production.yml` / 手動実行

## Migration Workflows

- `migrate.yml`
  - `staging` / `production` の 2 環境に対応
  - `main` への push 時は `staging` migration を自動実行
  - 手動実行時は `staging` / `production` / `both` を選択可能

## Release Workflow

- `release-production.yml`
  - `Deploy Production` の最後に自動実行
  - `vX.Y.Z` 形式のタグを作成
  - 自動実行時は直近の `v*.*.*` タグから `Z` を 1 つ上げる
  - `Deploy Production` 実行時に `major` / `minor` を任意指定可能
  - `workflow_dispatch` でも `major` / `minor` を任意指定可能
  - `major` と `minor` の同時指定は不可
  - `major` / `minor` 未指定時は直近タグの値を引き継ぐ
  - `major` を変更した場合は `vX.0.0`
  - `minor` を変更した場合は `vX.Y.0`
  - 前回の `v*.*.*` タグ以降に含まれる PR を収集して GitHub Release を作成

## 仕様書

詳細は [architecture.md](architecture.md) を参照してください。
