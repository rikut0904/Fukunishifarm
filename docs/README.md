# Fukunishi Farm

ふくにしファームの Web サイト基盤です。

## 構成

- フロントエンド: `frontend/` の Next.js
- バックエンド: `backend/` の Go + Echo
- デプロイ: Vercel(フロント) / Railway(API)

## 起動

```bash
docker compose up --build
```

## 仕様書

詳細は [architecture.md](architecture.md) を参照してください。
