# ShopSmart AI — Autonomous E-Commerce Assistant (Node.js local MVP)

PRD + architecture + diagrams live in `PRD.md`, `architecture.md`, `AI_1/`, `ShopSmartAI_Hackathon_Usecase.docx`.
**Stack decision: Node.js + Express + Next.js + SQLite only — no Java/Spring.** The PRD's
Java stack is superseded; all behavior contracts (APIs, state machines, grounding,
idempotency, audit) are preserved.

## Repo structure (4 folders)

```
shopsmart-ai/
  db/              # SQLite local: schema.sql, seed-data.json, knowledge_docs/*.md
  backend/         # Node.js + Express modular monolith (all domains + RAG + agents)
  frontend-web/    # Next.js 14 + React 18 + TypeScript storefront + admin
  frontend-app/    # React Native / Expo mobile application (storefront, assistant, cart, orders)
```

## Quickstart (Windows cmd)

```cmd
cd backend
npm.cmd install
copy .env.example .env
npm.cmd run seed
npm.cmd start
```

```cmd
cd frontend-web
npm.cmd install
copy .env.local.example .env.local
npm.cmd run dev
```

- Backend: http://localhost:4000/api/v1/health
- Web: http://localhost:3000
- Login: `customer@example.com / Password123` (also `prime@`, `support@`, `admin@` — see `db/seed-data.json`)

## Demos (PRD §21)

1. Assistant → *Suggest a laptop under $1000 for Java development and AI projects* → add to cart → checkout → Orders → track.
2. Assistant (knowledge) → *Can I return an opened laptop?* → cited answer → ask unsupported Q → NONE fallback.
3. Assistant (ops) → *Where is my order ORD-1001?* → timeline → cancel eligibility → execute.
4. Admin → create product, +10 stock, upload/activate doc, approve refund, view audit.
5. Checkout twice with same Idempotency-Key → same order, no double charge.

## Notes

- Payments/carriers/WMS are simulated (`PAID_SIMULATED`, `SIM-TRACK-*`).
- AI uses the live TokenHarbor key (`deepseek-v4.1-flash:free`) for extraction/generation;
  retrieval + ranking are deterministic and DB-grounded (no invented products/policies).
- `frontend-app/` runs via `cd frontend-app && npx expo start` (port 8081).
