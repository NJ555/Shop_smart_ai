# ShopSmart AI — `backend/` (Node.js + Express, modular monolith)

Fully implemented **Node.js 22 + Express 4.19 modular monolith** with SQLite (WAL mode) and DeepSeek AI integration — 100% JavaScript, zero Java/Spring dependencies.

## Layout

```
backend/
  package.json  (.env.example -> copy to .env)
  src/
    index.js            # app entry, mounts all modules
    config.js db.js
    middleware/ auth.js errors.js idempotency.js rateLimit.js
    utils/ ids.js sanitize.js llm.js embeddings.js ranking.js retrieval.js prompts.js
    modules/
      identity/  auth + profile + preferences
      catalog/   categories, search/filter/sort/pagination, PDP, compare, admin CRUD
      wishlist/  cart/  order/ (idempotent simulated checkout, cancel, shipment sim)
      support/   tickets + escalation
      knowledge/ doc upload/chunk/embed/activate (RAG store)
      assistant/ shopping AI + knowledge RAG + ops agent query (LIVE TokenHarbor LLM)
      agent/     tool runtime (11 tools), runs, approvals
      admin/     overview, orders, inventory adjust, shipment sim, audit
      audit/
    seed/seed.js
```

## API base

`http://localhost:4000/api/v1` — see PRD §11. Key routes:

Auth: `POST /auth/register|/login`, `GET /auth/me`, `PUT /auth/preferences`
Catalog: `GET /categories`, `GET /products/search?...`, `GET /products/:id`, `GET /products/compare?ids=`
Wishlist: `GET|POST /wishlist...`, Cart: `GET|POST|PUT|DELETE /cart...`
Orders: `POST /orders` (Idempotency-Key), `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel`, `GET /orders/:id/shipment`
AI: `POST /assistant/shopping/query`, `/assistant/knowledge/query`, `/assistant/ops/query`, `POST /agent/actions/execute`
Admin: `POST /admin/knowledge/documents`, `POST /admin/knowledge/documents/:id/activate`, `POST /admin/inventory/:id/adjust`, `GET /admin/overview|/orders|/inventory|/audit`, `GET|POST /agent/runs`, `/agent/approvals...`

Errors are RFC7807 problem JSON with `traceId`. Mutations accept `Idempotency-Key`.

## AI (live, not mock)

`TOKENHARBOR_API_KEY/BASE_URL/MODEL` in `.env` (see root `.env` for the key).
`utils/llm.js` calls TokenHarbor chat completions for: constraint extraction,
RAG grounded answers, ops phrasing. Retrieval/ranking stay deterministic in code
(DB-grounded, anti-hallucination). If the LLM is unreachable, endpoints fall back
to rule-based logic and still return grounded results.

## Run

```cmd
cd backend
npm.cmd install
copy .env.example .env
npm.cmd run seed
npm.cmd start
```
