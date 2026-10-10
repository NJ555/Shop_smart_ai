# ShopSmart AI — `frontend-web/` (Next.js 14 + React 18 + TypeScript)

Customer store + assistant + admin console. Talks to `backend/` at
`NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:4000/api/v1`).

## Pages

| Route | Screen |
|---|---|
| `/` | Home (hero, categories, top rated) |
| `/search` | Search + filters/sort/pagination (URL-preserved) |
| `/product/[id]` | PDP (gallery, specs, stock, cart/wishlist) |
| `/compare` | ≤4 side-by-side (localStorage list) |
| `/wishlist` `/cart` `/checkout` | Wishlist, cart (revalidation warnings), idempotent checkout |
| `/orders` `/orders/[id]` | History + detail with shipment timeline + cancel |
| `/assistant` | Shopping / Knowledge / Ops tabs (live LLM, grounded cards, citations, traceIds) |
| `/admin` | Overview, catalog create, inventory adjust, orders, docs upload/activate, agent runs + approvals, audit |
| `/profile` | Membership tier + preferences |

## Run

```cmd
cd frontend-web
npm.cmd install
copy .env.local.example .env.local
npm.cmd run dev
```

Open http://localhost:3000. Login with `customer@example.com / Password123`.
