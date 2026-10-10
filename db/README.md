# ShopSmart AI — `db/` (local SQLite)

Local-first database. No Docker / Postgres required.

## Files

| File | Purpose |
|---|---|
| `schema.sql` | SQLite DDL (all PRD §10 tables; embeddings as JSON arrays) |
| `seed-data.json` | Categories, 52 products (13 per category), inventory, users, policy docs, sample orders |
| `knowledge_docs/*.md` | 5 approved policy documents (return, refund, shipping, warranty, membership) |
| `shopsmart.db` | Created locally by `npm run seed` (git-ignored) |

## RAG storage

`knowledge_chunks.embedding` holds a 128-dim L2-normalized hashed TF vector (JSON).
Retrieval = cosine similarity + keyword overlap + metadata filter
(`status=ACTIVE`, region/category), topK=5. No pgvector needed.

## Recreate

```cmd
cd backend
npm.cmd install
npm.cmd run seed
```

This drops/creates `db/shopsmart.db` from `schema.sql` + `seed-data.json` + `knowledge_docs/`.
