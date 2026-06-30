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

## 起動

```bash
docker compose up --build
```

## 仕様書

詳細は [architecture.md](architecture.md) を参照してください。
