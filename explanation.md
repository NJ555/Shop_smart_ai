# ShopSmart AI — Complete Codebase Architecture & Technical Reference

> **Document Type:** Production Engineering Audit & Codebase Reference  
> **Repository Root:** `c:\Shop_smart_ai`  
> **Last Verified:** October 2026  
> **Current Stack:** Node.js 22 + Express 4.19 (Modular Monolith), SQLite 3 (WAL Mode), LangChain LCEL (`@langchain/core` + `@langchain/openai`), Next.js 14 (Web Storefront), React Native / Expo (Mobile Client), DeepSeek AI (`deepseek-v4.1-flash:free`).

---

## 2.1 Project Overview

### What the Application Does and Who It Serves
**ShopSmart AI** is a full-stack, enterprise-grade autonomous e-commerce platform and intelligent shopping assistant. It enables customers to discover, evaluate, compare, and purchase consumer electronics and home appliances through natural language dialogue and traditional faceted search, while giving customer support and operations staff real-time automated assistance, order tracking, and governed agentic workflows.

The system serves three primary user personas:
1. **Shoppers / Customers:** Everyday shoppers and loyalty members (`BASIC`, `PRIME`, `PREMIUM`) seeking personalized, budget-constrained product recommendations, factual spec comparisons, instant order tracking, and grounded answers to store policies (returns, warranties, shipping).
2. **Support Agents & Operations Managers:** Staff managing inventory adjustments, simulated carrier status overrides, customer support ticket escalations, and approving sensitive transactions (such as refunds exceeding the auto-approve threshold).
3. **Knowledge & Catalog Administrators:** Administrators responsible for uploading, versioning, chunking, and activating store policy documents, as well as managing product listings and category taxonomies.

### Major Features and User Interactions
- **Natural Language Shopping Consultation:** Shoppers describe their needs in plain English (e.g., *"Suggest a laptop under $1000 for programming and AI"*). The assistant extracts structured constraints (category, budget, RAM, storage, CPU, use cases) via DeepSeek, validates them against the active catalog taxonomy, runs a deterministic database query, applies multi-factor weighted ranking, and presents real product cards with grounded explanations.
- **Enterprise Policy RAG Engine:** Shoppers ask natural language questions regarding store policies (e.g., *"Can I return an opened laptop after 20 days?"*). The system performs hybrid retrieval (128-dimensional cosine vector similarity + keyword overlap with stop-word suppression) across active policy chunks, packages citations, and queries DeepSeek to generate a concise, grounded response. If evidence is insufficient, it strictly returns a fallback (`confidence: 'NONE'`).
- **Autonomous Operations & Agentic Tool Runtime:** Shoppers and support staff query order status or request cancellations. An operations orchestrator inspects the request, triggers strongly typed tools (`order.get`, `shipment.track`, `order.cancel_simulated`), verifies role-based permissions, enforces cancellation state-machine rules, and logs every tool execution into an immutable audit trail.
- **Faceted Catalog Discovery & 4-Way Comparison:** Shoppers browse categories, apply multi-attribute filters (price range, brand, rating, stock status), sort by price/rating/relevance, and select 2 to 4 items for side-by-side technical attribute comparison.
- **Cart, Wishlist & Atomic Idempotent Checkout:** Persistent cart and wishlist with server-side stock verification. Checkout recalculates prices, verifies stock availability, generates simulated shipments and tracking numbers, and enforces idempotency via the `Idempotency-Key` header to prevent double charges.
- **Human-in-the-Loop Governance:** Simulated refunds over $100 requested by basic customers automatically transition into `SIMULATED_REFUND_REQUESTED` and require sign-off in the Admin Console before payout completion.

### Actual Technology Stack by Component
| Layer | Actual Technology | Version / Configuration | Purpose |
|---|---|---|---|
| **Backend Runtime** | Node.js | v22.x LTS (x64 Windows) | High-performance asynchronous execution runtime |
| **Backend Framework** | Express | 4.19.2 | Modular monolith HTTP API server |
| **Database Engine** | SQLite 3 (`node:sqlite`) | Embedded `DatabaseSync` | Zero-configuration relational persistence with WAL mode & foreign key integrity |
| **LangChain Orchestration** | LangChain Expression Language (LCEL) | `@langchain/core` 1.2.x, `@langchain/openai` 1.6.x | Structured prompt templates, output parsers, and runnable pipelines |
| **AI LLM Integration** | DeepSeek | `deepseek-v4.1-flash:free` via OpenAI-compatible API | Constraint extraction, RAG answer generation, ops restatement |
| **Vector Search** | Custom In-Memory Vector Engine | 128-dim L2-normalized hashed TF vectors | Deterministic, local-first cosine similarity + keyword hybrid retrieval |
| **Web Storefront** | Next.js 14 / React 18 / TypeScript | 14.2.15 (App Router) | Responsive web client with SSR/SSG and client-side interactivity |
| **Mobile Application** | React Native / Expo | SDK 52 (Expo Router / TypeScript) | Native iOS/Android/Web cross-platform mobile client |
| **Authentication** | Stateless JWT (`jsonwebtoken`) + `bcryptjs` | Bearer token (HS256) | Role-based authorization & tenant isolation |
| **Schema Validation** | Zod | 3.23.8 | Strongly typed request body validation |

---

## 2.2 Frontend Web and App

### Web Application (`frontend-web`)
The web storefront is built with **Next.js 14 (App Router)** in TypeScript, located at `c:\Shop_smart_ai\frontend-web`.

#### Routing and Pages
All routes are organized in the `frontend-web/app` directory:
- `/` — **Homepage:** Hero banner, quick category links, featured products, and quick access to the AI assistant.
- `/search` — **Catalog Search & Filtering:** Dynamic query parameters for keyword search, category selection, price range, brand, minimum rating, stock availability, and sorting (relevance, price ascending/descending, rating).
- `/product/[id]` — **Product Detail Page (PDP):** Image display, price, stock status, full attribute breakdown, Add to Cart, and Add to Wishlist actions.
- `/compare` — **Side-by-Side Comparison:** 2-to-4 product comparative matrix matching technical attributes, pricing, and ratings.
- `/assistant` — **AI Consultation Hub:** 3 interactive sub-views:
  - *Shopping Assistant:* Natural language recommendation dialogue with live product cards and clarifying questions.
  - *Policy Q&A (RAG):* Store policy search with confidence ratings and source citations.
  - *Ops Support Agent:* Order status tracking and pre-shipment cancellation assistant.
- `/cart` — **Shopping Cart:** Real-time quantity adjustments, stock cap indicators, price subtotals, and checkout transition.
- `/checkout` — **Checkout Flow:** Shipping address form, shipping fee calculation based on membership tier, simulated payment selection, and idempotent order placement with generated `Idempotency-Key`.
- `/orders` — **Order History:** Customer order list with order status tags (`CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
- `/orders/[id]` — **Order Details & Live Tracking:** Order breakdown, line items, shipment timeline (`LABEL_CREATED` → `IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED`), and pre-shipment cancellation button.
- `/wishlist` — **Saved Items:** Persistent customer wishlist with quick "Move to Cart" button.
- `/profile` — **Customer Profile & Preferences:** Preferred categories, preferred brands, budget limits, and membership tier display.
- `/login` & `/register` — **Authentication:** Secure email/password login and registration with validation feedback.
- `/admin` — **Staff Management Console:** Overview metrics (revenue, orders, low stock, open tickets, pending approvals), inventory adjuster, simulated shipment status updater, refund approval decisions, and real-time audit log stream.

#### State Management and API Communication
- State is managed using native React hooks (`useState`, `useEffect`, `useCallback`) and React Context (`AuthContext` in `lib/auth.tsx`).
- API requests are executed through a unified HTTP fetch client in `lib/api.ts`:
  - Automatically attaches the `Authorization: Bearer <token>` header from `localStorage`.
  - Automatically generates and sends unique `Idempotency-Key` headers for mutations.
  - Maps non-2xx HTTP responses to an `ApiError` class that unpacks RFC 7807 problem details or server error messages.
  - Handles loading states, button disabling, error alerts, and empty states across all views.

### Mobile Application (`frontend-app`)
The mobile interface is built using **React Native and Expo SDK 52** in TypeScript, located at `c:\Shop_smart_ai\frontend-app`.

#### Architecture and Screens
The mobile application communicates with the exact same backend API (`http://localhost:4000/api/v1`) using the typed API client modules in `frontend-app/src/api/`:
- `HomeScreen.tsx` — Product catalog grid, category tabs, search input, and promotional highlights.
- `AssistantScreen.tsx` — Unified AI consultation interface supporting Shopping, Knowledge RAG, and Ops Agent modes with native keyboard handling and card rendering.
- `ProductDetailModal.tsx` — Full product specifications modal, stock badge, and Add to Cart action.
- `CartCheckoutModal.tsx` — Slide-up bottom sheet for cart management and simulated checkout.
- `OrdersScreen.tsx` — Native order history and shipment timeline modal with cancellation triggers.
- `CompareWishlistScreen.tsx` — Tabbed view for saved wishlist items and product comparison.
- `OpsAdminScreen.tsx` — Mobile admin dashboard for on-call operations managers to inspect low stock, approve refunds, and view audit events.

#### Differences Between Web and Mobile
Both applications share the exact same backend business logic, database, and authentication tokens. They differ only in presentation: Next.js uses standard HTML5/CSS3 flexbox/grid layouts with browser history routing, while Expo uses React Native native primitives (`View`, `Text`, `FlatList`, `Modal`, `ScrollView`) styled with `StyleSheet`. Zero responses are mocked in either client.

---

## 2.3 Backend Architecture

### Framework, Entry Point, and Directory Structure
The backend is structured as a **modular monolith** in Node.js 22 using Express 4.19, located at `c:\Shop_smart_ai\backend`.
The primary application entry point is `backend/src/index.js`.

```text
backend/
├── package.json               # Node.js dependencies and scripts (start, seed, test)
├── .env                       # Local environment variables (git-ignored)
├── .env.example               # Clean environment variable template
├── tests/                     # 6 automated integration test suites (32 tests)
│   ├── auth.test.js
│   ├── catalog.test.js
│   ├── cart_orders.test.js
│   ├── rag_knowledge.test.js
│   ├── agent_ops.test.js
│   └── assistant_shopping.test.js
└── src/
    ├── index.js               # Application entry point, middleware & route mounting
    ├── config.js              # Environment variable loader & defaults
    ├── db.js                  # Native node:sqlite DatabaseSync singleton
    ├── middleware/
    │   ├── auth.js            # JWT verification & RBAC role guards
    │   ├── errors.js          # 404 and global error handlers
    │   ├── idempotency.js     # Idempotency cache, audit logger & outbox writer
    │   └── rateLimit.js       # IP/User rate limiting (auth: 60/min, AI: 40/min)
    ├── utils/
    │   ├── ids.js             # CUID generators, sha256 hashing, timestamp formatting
    │   ├── sanitize.js        # Input sanitization & prompt injection quarantine
    │   ├── llm.js             # DeepSeek API client with retries, timeouts, and JSON extraction
    │   ├── embeddings.js      # 128-dim hashed TF vector embed, cosine, keyword overlap
    │   ├── ranking.js         # Multi-attribute constraint extractor & weighted product scoring
    │   ├── retrieval.js       # Hybrid RAG chunk retrieval & confidence scoring
    │   └── prompts.js         # Strict system prompts for extraction, RAG, and ops
    ├── seed/
    │   └── seed.js            # Repeatable, idempotent database seed script
    └── modules/
        ├── identity/          # Registration, login, profile, preferences
        ├── catalog/           # Categories, products, search, compare, admin CRUD
        ├── wishlist/          # Customer wishlist & items
        ├── cart/              # Active cart, items, stock validation
        ├── order/             # Idempotent checkout, order detail, shipment tracking, cancellation
        ├── support/           # Customer tickets, messages, escalation
        ├── assistant/         # Shopping recommendations, RAG policy queries, ops assistant
        ├── agent/             # Tool execution runtime (11 tools), agent runs, approvals
        ├── knowledge/         # Policy document upload, chunking, embedding, activation
        ├── admin/             # Operations overview, inventory adjustment, shipment simulator
        └── audit/             # Immutable audit log inspection
```

### Module Responsibilities and Boundaries
Each module is encapsulated in `backend/src/modules/<domain>` and exports Express routers:
- **`identity`**: User registration, password hashing (`bcryptjs`), JWT issuance, customer profile preferences.
- **`catalog`**: Product filtering, full-text substring search, faceted query parsing, pagination, product comparison, catalog manager product CRUD.
- **`wishlist`**: Saved items per user, unique product enforcement.
- **`cart`**: Active customer cart session, line item quantity manipulation, stock cap validation, line total calculation.
- **`order`**: Transactional checkout, server-side price re-verification, stock reservation, simulated shipment generation with background progression timers, order cancellation state machine, and simulated refunds.
- **`support`**: Customer support tickets, threaded messages, escalation to human support queue.
- **`assistant`**: Live DeepSeek constraint extraction, DB-only product grounding, deterministic ranking, RAG policy retrieval, and ops query dispatching.
- **`agent`**: Registry of 11 strongly typed tools, role-based tool gating, tool call logging (`agent_tool_calls`), agent run records, and refund approval resolution.
- **`knowledge`**: Document ingestion, markdown heading parser, chunking, 128-dimensional vector generation, document activation, and superseding previous versions.
- **`admin`**: System overview metrics, inventory manual overrides, manual carrier event injection, approval decision endpoints.
- **`audit`**: Read-only access to immutable audit log records.

### Request Lifecycle
```
Client Request (HTTPS / JSON)
       │
       ▼
[Helmet Security Headers] ──> [CORS Validation] ──> [JSON Body Parser (2MB limit)]
       │
       ▼
[Request Trace ID Generator (x-trace-id header)]
       │
       ▼
[Rate Limiting (auth: 60/m, ai: 40/m)]
       │
       ▼
[JWT Authentication Middleware] (verifies signature, issuer, expiration; sets req.user)
       │
       ▼
[RBAC Role Guard] (verifies req.user.role against allowed roles)
       │
       ▼
[Domain Controller] (validates schema via Zod, checks Idempotency-Key)
       │
  ┌────┴───────────────────────────┐
  ▼                                ▼
[Database Operations (SQLite)]    [AI Pipeline (DeepSeek / RAG / Tools)]
  │                                │
  └────┬───────────────────────────┘
       ▼
[Transactional Outbox / Audit Log Emission]
       │
       ▼
HTTP Response (Status Code + JSON Body + x-trace-id)
```

### Application Security & Database Transactions
- **Password Security:** Passwords hashed with `bcryptjs` using 10 salt rounds.
- **API Token Security:** Stateless JWTs signed with `JWT_SECRET` (HS256) containing `sub`, `email`, `role`, and `membership_tier`. Tokens expire after 24 hours.
- **Database Concurrency:** SQLite in WAL mode (`PRAGMA journal_mode=WAL`) allows concurrent readers while serializing atomic writers. Foreign keys are strictly enforced (`PRAGMA foreign_keys=ON`).
- **Inventory Concurrency:** Checkout atomically checks `available_quantity >= requested_quantity` and decrements stock within a transaction boundary. If insufficient stock is found, checkout aborts with HTTP `409 Conflict`.
- **IDOR Protection:** Order and ticket lookups strictly verify that `entity.user_id === req.user.id` unless the caller possesses staff roles (`SUPPORT_AGENT`, `OPS_MANAGER`, `ADMIN`).

---

## 2.4 Complete API Endpoint Reference

| Method | Endpoint | Purpose | Authentication | Request / Response Summary | Status |
|---|---|---|---|---|---|
| `GET` | `/` | Service root & version info | Public | Response: `{ service, version, stack, docs }` | Verified |
| `GET` | `/api/v1/health` | System health & LLM status | Public | Response: `{ ok: true, db: 'sqlite', llm: 'configured', model }` | Verified |
| `POST` | `/api/v1/auth/register` | Register new customer | Public | Body: `{ email, password, fullName }`<br/>Response (201): `{ accessToken, tokenType, user }` | Verified |
| `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT | Public | Body: `{ email, password }`<br/>Response (200): `{ accessToken, tokenType, user }` | Verified |
| `GET` | `/api/v1/auth/me` | Fetch active user profile | Bearer JWT | Response (200): User profile + customer preferences object | Verified |
| `PUT` | `/api/v1/auth/preferences` | Update customer preferences | Bearer JWT | Body: `{ preferredCategories, preferredBrands, budgetMin, budgetMax, fullName }`<br/>Response (200): `{ ok: true }` | Verified |
| `GET` | `/api/v1/categories` | List active categories | Public | Response (200): Array of active category objects | Verified |
| `GET` | `/api/v1/products/search` | Search & filter products | Public | Query: `query, category, minPrice, maxPrice, brand, rating, availability, sort, page, size`<br/>Response (200): `{ items, total, page, size }` | Verified |
| `GET` | `/api/v1/products/compare` | Compare 2-4 products | Public | Query: `ids=PRD1,PRD2`<br/>Response (200): `{ items: [...] }` | Verified |
| `GET` | `/api/v1/products/:id` | Get product details by ID or slug | Public | Response (200): Enriched product object with inventory & attributes | Verified |
| `POST` | `/api/v1/products` | Create product listing | `CATALOG_MANAGER`, `ADMIN` | Body: `{ name, brand, category, price, rating, description, attributes, inventory }`<br/>Response (201): `{ productId }` | Verified |
| `PUT` | `/api/v1/products/:id` | Update product listing | `CATALOG_MANAGER`, `ADMIN` | Body: Partial product schema<br/>Response (200): `{ ok: true }` | Verified |
| `GET` | `/api/v1/wishlist` | Get user's wishlist | Bearer JWT | Response (200): `{ items: [...] }` | Verified |
| `POST` | `/api/v1/wishlist/items` | Add product to wishlist | Bearer JWT | Body: `{ productId }`<br/>Response (201): `{ ok: true }` | Verified |
| `DELETE` | `/api/v1/wishlist/items/:productId` | Remove product from wishlist | Bearer JWT | Response (200): `{ ok: true }` | Verified |
| `GET` | `/api/v1/cart` | Get active cart & line totals | Bearer JWT | Response (200): `{ cartId, items, subtotal, count }` | Verified |
| `POST` | `/api/v1/cart/items` | Add or increment item in cart | Bearer JWT | Body: `{ productId, quantity }`<br/>Response (201): Cart view with updated totals | Verified |
| `PUT` | `/api/v1/cart/items/:itemId` | Update cart item quantity | Bearer JWT | Body: `{ quantity }`<br/>Response (200): Cart view with updated totals | Verified |
| `DELETE` | `/api/v1/cart/items/:itemId` | Remove single cart item | Bearer JWT | Response (200): Cart view with updated totals | Verified |
| `DELETE` | `/api/v1/cart` | Clear entire cart | Bearer JWT | Response (200): `{ cartId, items: [], subtotal: 0, count: 0 }` | Verified |
| `POST` | `/api/v1/orders` | Place order (Simulated Checkout) | Bearer JWT (Idempotency-Key support) | Body: `{ cartId, shippingAddress, paymentMode }`<br/>Response (201): `{ orderId, orderNumber, status: 'CONFIRMED', total, paymentStatus }` | Verified |
| `GET` | `/api/v1/orders` | List user's orders | Bearer JWT | Response (200): `{ items: [...] }` | Verified |
| `GET` | `/api/v1/orders/:id` | Get order details | Bearer JWT (Owner / Staff) | Response (200): Detailed order view with item snapshots & totals | Verified |
| `GET` | `/api/v1/orders/:id/shipment` | Get shipment tracking events | Bearer JWT (Owner / Staff) | Response (200): `{ shipmentId, status, trackingNumber, carrier, eta, events: [...] }` | Verified |
| `POST` | `/api/v1/orders/:id/cancel` | Cancel order pre-shipment | Bearer JWT (Owner / Staff) | Body: `{ reason }`<br/>Response (200): `{ orderId, orderNumber, status: 'CANCELLED', refundStatus }` | Verified |
| `POST` | `/api/v1/assistant/shopping/query` | Shopping assistant recommendation | Bearer JWT | Body: `{ query }`<br/>Response (200): `{ conversationId, interpretedRequirement, recommendations: [...], clarifyingQuestion }` | Verified |
| `POST` | `/api/v1/assistant/knowledge/query` | Policy Q&A via RAG | Bearer JWT | Body: `{ query, region, category }`<br/>Response (200): `{ answer, confidence, sources: [...], followUpRequired }` | Verified |
| `POST` | `/api/v1/assistant/ops/query` | Operations assistant query | Bearer JWT | Body: `{ query }`<br/>Response (200): `{ answer, suggestedActions: [...], agentRunId, intent, selectedAgent }` | Verified |
| `POST` | `/api/v1/agent/actions/execute` | Execute controlled agent tool | Bearer JWT (Role-checked per tool) | Body: `{ tool, input, idempotencyKey }`<br/>Response (200): `{ agentRunId, ok, data }` | Verified |
| `GET` | `/api/v1/agent/runs` | List recent agent runs | `SUPPORT_AGENT`, `OPS_MANAGER`, `ADMIN` | Response (200): `{ items: [...] }` | Verified |
| `GET` | `/api/v1/agent/runs/:id` | Get agent run & tool calls | `SUPPORT_AGENT`, `OPS_MANAGER`, `ADMIN` | Response (200): Agent run record with parsed `toolCalls: [...]` | Verified |
| `GET` | `/api/v1/agent/approvals` | List pending approval requests | `OPS_MANAGER`, `ADMIN` | Response (200): `{ items: [...] }` | Verified |
| `POST` | `/api/v1/agent/approvals/:id/decide` | Approve or reject request | `OPS_MANAGER`, `ADMIN` | Body: `{ approve: boolean }`<br/>Response (200): `{ ok: true, status: 'APPROVED' \| 'REJECTED' }` | Verified |
| `GET` | `/api/v1/knowledge/documents` | List knowledge documents | Bearer JWT (Active for users, All for staff) | Response (200): `{ items: [...] }` | Verified |
| `POST` | `/api/v1/knowledge/documents` | Upload & chunk policy document | `KNOWLEDGE_ADMIN`, `ADMIN` | Multipart/Form: `file`, `title`, `category`, `version`, `effectiveDate`, `region`<br/>Response (201): `{ documentId, chunks, status: 'DRAFT' }` | Verified |
| `GET` | `/api/v1/knowledge/documents/:id/chunks` | Inspect document chunks | `KNOWLEDGE_ADMIN`, `ADMIN` | Response (200): `{ items: [{ chunkIndex, heading, preview }] }` | Verified |
| `POST` | `/api/v1/knowledge/documents/:id/activate` | Activate policy document | `KNOWLEDGE_ADMIN`, `ADMIN` | Response (200): `{ ok: true, status: 'ACTIVE' }` | Verified |
| `GET` | `/api/v1/support/tickets` | List user tickets or all staff tickets | Bearer JWT | Response (200): `{ items: [...] }` | Verified |
| `POST` | `/api/v1/support/tickets` | Create support ticket | Bearer JWT | Body: `{ orderId, category, subject, message, priority }`<br/>Response (201): Ticket view with initial message | Verified |
| `GET` | `/api/v1/support/tickets/:id` | Get ticket & message thread | Bearer JWT (Owner / Staff) | Response (200): Ticket view with `messages: [...]` | Verified |
| `POST` | `/api/v1/support/tickets/:id/messages` | Post reply to ticket thread | Bearer JWT (Owner / Staff) | Body: `{ message }`<br/>Response (201): `{ ok: true }` | Verified |
| `POST` | `/api/v1/support/tickets/:id/escalate` | Escalate ticket to high priority | Bearer JWT (Owner / Staff) | Body: `{ reason }`<br/>Response (200): Updated ticket view | Verified |
| `GET` | `/api/v1/admin/overview` | Admin overview metrics | Staff roles | Response (200): `{ users, products, orders, revenue, lowStock, openTickets, pendingApprovals, activeDocs }` | Verified |
| `GET` | `/api/v1/admin/orders` | Search all customer orders | `SUPPORT_AGENT`, `OPS_MANAGER`, `ADMIN` | Query: `search=...`<br/>Response (200): `{ items: [...] }` | Verified |
| `GET` | `/api/v1/admin/inventory` | List all inventory levels | `OPS_MANAGER`, `CATALOG_MANAGER`, `ADMIN` | Response (200): `{ items: [...] }` | Verified |
| `POST` | `/api/v1/admin/inventory/:productId/adjust` | Manual inventory override | `OPS_MANAGER`, `ADMIN` | Body: `{ delta: integer, reason }`<br/>Response (200): `{ ok: true, stock }` | Verified |
| `POST` | `/api/v1/admin/shipments/:orderId/status` | Manual shipment status update | `OPS_MANAGER`, `ADMIN` | Body: `{ status: 'IN_TRANSIT' \| 'OUT_FOR_DELIVERY' \| 'DELIVERED' \| 'DELAYED' }`<br/>Response (200): `{ ok: true, status }` | Verified |
| `GET` | `/api/v1/admin/audit` | List system audit log events | `OPS_MANAGER`, `ADMIN` | Response (200): `{ items: [...] }` | Verified |
| `GET` | `/api/v1/audit` | List audit logs | `OPS_MANAGER`, `ADMIN` | Response (200): `{ items: [...] }` | Verified |

---

## 2.5 Database and Data Flow

### Database Engine & Configuration
The database engine is **SQLite 3** running via Node.js 22's built-in `node:sqlite` (`DatabaseSync` class).
Database connection initialization (`backend/src/db.js`):
- PRAGMAs executed at boot:
  - `PRAGMA journal_mode = WAL;` — Write-Ahead Logging allows concurrent reads without blocking writes.
  - `PRAGMA foreign_keys = ON;` — Strict relational constraint enforcement on foreign keys with `ON DELETE CASCADE`.
  - `PRAGMA synchronous = NORMAL;` — Optimal performance and crash resilience.

### Schema, Tables, Constraints, and Indexes
The relational schema comprises **17 core tables** defined in `db/schema.sql`:
1. `users` — Unique email, hashed password, role (`CUSTOMER`, `SUPPORT_AGENT`, `OPS_MANAGER`, `CATALOG_MANAGER`, `KNOWLEDGE_ADMIN`, `ADMIN`), membership tier (`BASIC`, `PRIME`, `PREMIUM`).
2. `customer_preferences` — 1-to-1 with `users`, stores preferred categories, brands, budget bounds (JSON strings).
3. `categories` — Category hierarchy (`id`, `name`, `slug` UNIQUE, `parent_id` self-reference, `is_active`).
4. `products` — Product catalog (`id`, `name`, `slug` UNIQUE, `category_id` FK, `brand`, `description`, `price`, `rating`, `is_active`). Indexes on `category_id`, `price`, `rating`, `brand`.
5. `product_attributes` — Key-value specifications per product (`ram`, `storage`, `cpu`, `color`, `weight`, etc.). Indexed on `product_id` and `(attribute_key, attribute_value)`.
6. `product_images` — Image URLs, primary flag, display order per product.
7. `inventory_levels` — Available and reserved stock counts, optimistic concurrency lock `version` counter.
8. `wishlists` & `wishlist_items` — Saved items per customer with unique compound constraint `(wishlist_id, product_id)`.
9. `carts` & `cart_items` — Active shopping cart with line quantities and compound constraint `(cart_id, product_id)`.
10. `orders` & `order_items` — Immutable order headers and line item snapshots (`product_name_snapshot`, `unit_price_snapshot`, `attributes_snapshot`), unique `idempotency_key`.
11. `shipments` & `shipment_events` — Simulated logistics tracking, carrier name, ETA, tracking number, and time-stamped milestone events (`LABEL_CREATED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `DELAYED`).
12. `refunds` — Refund amounts, reasons, and state (`SIMULATED_REFUND_REQUESTED`, `SIMULATED_REFUND_COMPLETED`).
13. `support_tickets` & `support_messages` — Support cases, priority, status (`OPEN`, `PENDING`, `RESOLVED`), and threaded conversation messages.
14. `knowledge_documents` — Document metadata, title, category, version, effective date, region, status (`DRAFT`, `ACTIVE`, `SUPERSEDED`, `ARCHIVED`), sha256 checksum, raw text.
15. `knowledge_chunks` — Section headings, chunk text, 128-dimensional embedding stored as serialized JSON array (`TEXT`), metadata JSON. Indexed on `document_id`.
16. `assistant_conversations` & `assistant_messages` — Dialogue session history and structured trace metadata.
17. `agent_runs` & `agent_tool_calls` — Operations agent execution trails, input queries, dispatched tools, tool input JSON, tool output JSON, execution status, latency, error codes.
18. `audit_logs` — Immutable audit records: `actor_id`, `actor_type`, `action`, `entity_type`, `entity_id`, `before_json`, `after_json`, `trace_id`.
19. `idempotency_keys` — Mutation replay protection: `key`, `endpoint`, `request_hash`, `response_json`, `expires_at`.
20. `outbox_events` — Transactional outbox event store: `aggregate_type`, `aggregate_id`, `event_type`, `payload`, `status`.
21. `approvals` — Human-in-the-loop decision queue for sensitive transactions (refunds > $100).

### Migrations and Seed Data Management
- Schema creation is safe and repeatable via `db/schema.sql` using `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.
- The database is seeded idempotently using `backend/src/seed/seed.js` (`npm run seed`):
  - Populates 4 categories (`laptops`, `smartphones`, `appliances`, `accessories`).
  - Populates **52 realistic, highly detailed products** (13 per category) with full attributes and initial stock.
  - Populates 10 user accounts across all customer and staff roles with hashed passwords.
  - Ingests and chunks 5 versioned markdown policy documents from `db/knowledge_docs/`, generating 24 chunks with 128-dimensional embeddings.
  - Creates 3 sample orders with shipment timelines, 1 support ticket, and 1 pending refund approval.
  - Clean reset procedure: `npm run seed` drops and recreates tables from scratch, ensuring a pristine development environment without touching production.

### Vector Search vs. Relational Queries
- **PostgreSQL / pgvector:** Neither PostgreSQL nor the `pgvector` extension is used in this deployment.
- **SQLite Vector Implementation:** 128-dimensional L2-normalized hashed term-frequency vectors are stored as JSON arrays in `knowledge_chunks.embedding`.
- **Query Distinction:** Regular database queries use standard SQL indexes (B-Tree lookups on `products.category_id`, `products.price`, `orders.user_id`). Vector searches retrieve active candidate rows and execute an in-process mathematical cosine similarity dot-product + keyword overlap calculation, ranking candidates in descending order.

---

## 2.6 RAG Implementation

### Complete Retrieval-Augmented Generation Pipeline
1. **Source Document Ingestion:** Policy documents (Markdown or plain text) enter the system via the seed script or via `POST /api/v1/knowledge/documents` uploaded by a `KNOWLEDGE_ADMIN`.
2. **Text Cleaning & Section Chunking:** In `backend/src/modules/knowledge/routes.js` (`chunkText`), the text is split along Markdown headings (`#`, `##`, `###`). Chunks target 200–400 words with a 200-character overlap, ensuring complete policy paragraphs and section titles remain intact.
3. **Embedding Model & Dimensionality:** Vectors are generated by `embed()` in `backend/src/utils/embeddings.js`. It computes a 128-dimensional term frequency representation using 32-bit FNV-1a hashing with sub-word bigram backoff, normalized via Euclidean L2-norm (`Math.sqrt(sum(x^2))`).
4. **Storage & Metadata:** Embeddings and metadata (`version`, `category`, `region`, `effectiveDate`) are stored in `knowledge_chunks` with a foreign key to `knowledge_documents`.
5. **Query Processing:** When a user queries `POST /api/v1/assistant/knowledge/query`, the query is sanitized (`sanitizeQuery`) to strip control characters and prompt injection delimiters.
6. **Retrieval, Ranking & Filtering:** In `backend/src/utils/retrieval.js` (`retrieveChunks`):
   - Strict metadata filter enforces `knowledge_documents.status = 'ACTIVE'`, matching requested region or `GLOBAL`, and requested category or `GENERAL`.
   - Hybrid scoring evaluates both vector cosine similarity (60% weight) and stop-word filtered keyword overlap (40% weight).
   - A strict relevance threshold of `score >= 0.22` filters out irrelevant chunks.
   - If no chunks pass the threshold, retrieval immediately returns `{ chunks: [], confidence: 'NONE' }`.
7. **Answer Generation:** Retrieved chunks are formatted with citations (`[1] (Doc §Section vVersion): Content`) and passed along with the query to DeepSeek via `chatComplete` using the strict `RAG_SYSTEM` prompt.
8. **Citations & Supporting Evidence:** The API response packages citations containing the exact document title, section heading, policy version, effective date, and chunk ID (`sources: [...]`).
9. **Duplicate Prevention & Updates:** When an admin activates a new document version via `POST /api/v1/knowledge/documents/:id/activate`, the system automatically marks previous active documents with the same title and region as `SUPERSEDED`, guaranteeing stale policies are never retrieved.
10. **Insufficient Context Handling:** If retrieval confidence is `'NONE'`, the system does not query the model and immediately returns:
   > *"I don't have enough approved information to answer that accurately."*

### LangChain Integration Architecture
**LangChain is fully integrated into the ShopSmart AI core intelligence layer** using modern LangChain Expression Language (LCEL) chains with `@langchain/core` (v1.2.17) and `@langchain/openai` (v1.6.2).

#### 1. Core LangChain Orchestration Module (`backend/src/utils/langchain.js`)
All LangChain models, prompts, parsers, and runnable pipelines are centralized in `backend/src/utils/langchain.js`. It configures a cached, connection-pooled `ChatOpenAI` instance targeting the TokenHarbor / DeepSeek endpoint:
```javascript
const { ChatOpenAI } = require('@langchain/openai');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');

const model = new ChatOpenAI({
  apiKey: config.llm.apiKey,
  configuration: { baseURL: config.llm.baseUrl },
  model: config.llm.model, // deepseek-v4.1-flash:free
  temperature: 0.2,
  maxTokens: 800,
});
```

#### 2. Four Production LCEL Chains
The module defines and exports four production-ready LCEL runnable pipelines:
1. **Shopping Constraint Extraction Chain (`extractConstraintsWithLangChain`)**:
   - **Pipeline:** `ChatPromptTemplate.fromMessages([['system', EXTRACTION_SYSTEM], ['user', 'Query: {query}']]).pipe(model).pipe(new StringOutputParser())`
   - **Role:** Extracts structured budget (`max`), category hint (`laptops`, `smartphones`, etc.), use-cases (`programming`, `gaming`), and hardware specs into validated JSON.
2. **Shopping Need Synthesis Chain (`interpretShoppingNeedWithLangChain`)**:
   - **Pipeline:** `ChatPromptTemplate.fromMessages([['system', REWRITE_SYSTEM], ['user', '{query}']]).pipe(model).pipe(new StringOutputParser())`
   - **Role:** Synthesizes a concise 6-to-10 word customer requirement phrase to display alongside catalog matches.
3. **Policy Knowledge RAG Chain (`answerRagWithLangChain`)**:
   - **Pipeline:** `ChatPromptTemplate.fromMessages([['system', RAG_SYSTEM], ['user', 'Context:\n{context}\n\nQuestion: {question}\nAnswer in 2-4 sentences.']]).pipe(model).pipe(new StringOutputParser())`
   - **Role:** Takes retrieved policy chunks and formats factual, cited policy answers with strict hallucination guardrails.
4. **Autonomous Ops Agent Synthesis Chain (`rephraseOpsWithLangChain`)**:
   - **Pipeline:** `ChatPromptTemplate.fromMessages([['system', OPS_SYSTEM], ['user', 'User asked: {query}\nVerified facts: {facts}\nDraft: {draft}\nRestate factually in 1-3 sentences...']]).pipe(model).pipe(new StringOutputParser())`
   - **Role:** Synthesizes governed operations output from verified tool executions (`order.get`, `shipment.track`, `order.cancel_simulated`) without hallucinating order or shipment statuses.

#### 3. Backend Wiring & Integration Points
- **Shopping Route (`backend/src/modules/assistant/routes.js`):** `POST /api/v1/assistant/shopping/query` executes `extractConstraintsWithLangChain(sanitized)` to extract search parameters, queries the SQLite catalog, ranks candidates deterministically, formats an interpreted need via `interpretShoppingNeedWithLangChain(sanitized)`, and returns recommendations marked with `engine: 'langchain-lcel'`.
- **Knowledge RAG Route (`backend/src/modules/assistant/routes.js`):** `POST /api/v1/assistant/knowledge/query` retrieves chunks from the SQLite vector engine, constructs contextual citations, and passes them to `answerRagWithLangChain(context, sanitized)`, returning citations and `engine: 'langchain-lcel'`.
- **Operations Agent Service (`backend/src/modules/agent/service.js`):** `handleOpsQuery` executes deterministic tool calls (`order.get`, `shipment.track`), passes verified facts to `rephraseOpsWithLangChain(query, toolOutputs, draft)`, and returns structured actions and `engine: 'langchain-lcel'`.

#### 4. Dual Client Integration (Web & Mobile)
- **Web Storefront (`frontend-web/app/assistant/page.tsx`):**
  - Connects to all three LangChain-powered assistant endpoints.
  - Displays a green `🦜️🔗 LangChain LCEL` badge on responses.
  - Renders grounded product recommendation cards with 1-tap "Add to Cart", verified citation sources, and executable tool action buttons.
- **Mobile Client (`frontend-app/src/screens/AssistantScreen.tsx`):**
  - Connects to the same LangChain endpoints via `frontend-app/src/api/assistant.ts`.
  - Detects `res.engine === 'langchain-lcel'` and renders a native `🦜️🔗 LangChain LCEL` pill badge in the trace header.
  - Supports instant prompt pills, live order status checks, and cancellation triggers.

---

## 2.7 DeepSeek Integration

### Configured Model & Environment Loading
- **Configured Model:** `deepseek-v4.1-flash:free` (or direct `deepseek-chat` / `deepseek-reasoner`).
- **Configuration Loading:** Loaded via `backend/src/config.js` with fallback support:
  - API Key: `process.env.DEEPSEEK_API_KEY || process.env.TOKENHARBOR_API_KEY`
  - Base URL: `process.env.DEEPSEEK_BASE_URL || process.env.TOKENHARBOR_BASE_URL || 'https://api.tokenharbor.io/v1'`
  - Model Name: `process.env.DEEPSEEK_MODEL || process.env.TOKENHARBOR_MODEL || 'deepseek-v4.1-flash:free'`
  - Timeout: 20,000 milliseconds (20 seconds).
  - Retries: Up to 2 bounded retries with exponential backoff on HTTP 429 rate limit or 5xx server errors.

### Backend Call Flow
```
User Query ──> sanitizeQuery() ──> chatComplete(messages, { maxTokens, temperature })
      │
      ▼
Fetch POST to ${config.llm.baseUrl}/chat/completions
Headers: { Authorization: "Bearer ***", Content-Type: "application/json" }
Body: { model: "deepseek-v4.1-flash:free", messages: [...], temperature: 0.2, max_tokens: 800 }
      │
      ▼
On 429/5xx: Exponential Backoff (500ms, 1000ms) ──> Retry
On 200 OK: Returns choices[0].message.content
On Timeout / Failure: Safe error code (LLM_TIMEOUT, LLM_HTTP_ERROR, NO_LLM_KEY)
```

### Hallucination Prevention Safeguards
The platform enforces strict layered safeguards:
1. **Catalog Grounding Invariant:** DeepSeek is **never** permitted to generate product recommendations from internal weights. DeepSeek is only used to extract search constraints (`category`, `maxBudget`, `useCases`) into structured JSON. The actual products returned are queried directly from the SQLite `products` table via `SELECT ... WHERE price <= max`. If zero database records match, the system explicitly informs the user that no products exist at that price point.
2. **Deterministic Ranking:** Recommendations are ranked using deterministic code algorithms (budget fit, spec fit, rating, preference affinity), not generative model guessing.
3. **RAG Boundary Enforcement:** The system prompt `RAG_SYSTEM` explicitly instructs DeepSeek:
   > *"Answer ONLY from the provided approved context chunks. If the context does not contain the answer, reply exactly: I don't have enough approved information to answer that accurately."*
4. **Stop-Word Filtered Thresholding:** Queries on out-of-domain topics (e.g. corporate jets, medical advice) produce a hybrid score < 0.22, resulting in zero retrieved chunks and immediate safe fallback delivery before calling the model.
5. **No Secret Leaks:** API keys are never returned in HTTP responses, never logged in morgan/tiny logs, and never exposed to the frontend bundles.
6. **Graceful Degradation:** If the DeepSeek API key is absent, requests return a clean HTTP 503 `NO_LLM_KEY` status code rather than fabricating fake mock AI answers.

---

## 2.8 Environment and Deployment

### Environment Variables Reference
| Variable Name | Purpose | Required? | Default / Example Value |
|---|---|---|---|
| `PORT` | Backend HTTP API listening port | Optional | `4000` |
| `DB_PATH` | Path to SQLite database file | Optional | `../db/shopsmart.db` |
| `JWT_SECRET` | Secret key for signing HS256 JWT tokens | **Required** in production | `shopsmart-hackathon-jwt-secret-dev-2026` |
| `JWT_EXPIRES_IN` | JWT token lifetime | Optional | `24h` |
| `REFUND_APPROVAL_THRESHOLD` | Maximum dollar amount for auto-approved refunds | Optional | `100` |
| `DEEPSEEK_API_KEY` | DeepSeek cloud API key | **Required** for AI | `sk-...` |
| `DEEPSEEK_BASE_URL` | DeepSeek API base URL (OpenAI-compatible) | Optional | `https://api.deepseek.com/v1` or `https://api.tokenharbor.io/v1` |
| `DEEPSEEK_MODEL` | DeepSeek model identifier | Optional | `deepseek-v4.1-flash:free` or `deepseek-chat` |
| `TOKENHARBOR_API_KEY` | TokenHarbor gateway key (DeepSeek fallback) | Optional | `th-...` |
| `TOKENHARBOR_BASE_URL` | TokenHarbor gateway base URL | Optional | `https://api.tokenharbor.io/v1` |
| `TOKENHARBOR_MODEL` | TokenHarbor model identifier | Optional | `deepseek-v4.1-flash:free` |
| `NEXT_PUBLIC_API_BASE_URL` | Web frontend API endpoint | Optional | `http://localhost:4000/api/v1` |
| `EXPO_PUBLIC_API_URL` | Mobile app API endpoint | Optional | `http://localhost:4000/api/v1` |

### Installation and Local Startup Instructions

#### Step 1: Database Setup and Seeding
```cmd
cd c:\Shop_smart_ai\backend
npm install
copy .env.example .env
npm run seed
```
*Output: Populates 52 products (13/category), 10 users, 24 RAG chunks, 3 orders, 1 ticket, 1 approval in `db/shopsmart.db`.*

#### Step 2: Backend API Startup
```cmd
cd c:\Shop_smart_ai\backend
npm start
```
*Health verification:* Navigate to `http://localhost:4000/api/v1/health`.

#### Step 3: Run Backend Automated Test Suite
```cmd
cd c:\Shop_smart_ai\backend
npm test
```
*Verification: Runs 32 automated integration tests across all domains with 0 failures.*

#### Step 4: Web Storefront Startup
```cmd
cd c:\Shop_smart_ai\frontend-web
npm install
copy .env.local.example .env.local
npm run dev
```
*Access Web App:* Open `http://localhost:3000` in the browser.  
*Production Build Check:* `npm run build` compiles all 15 routes cleanly.

#### Step 5: Mobile App Startup
```cmd
cd c:\Shop_smart_ai\frontend-app
npm install
npx expo start
```
*Access Mobile App:* Open `http://localhost:8081` or scan QR code with Expo Go.

---

## 2.9 Known Issues and Remaining Work

### Discovered Issues and Fixes Applied During Audit
1. **Legacy Java/Spring Boot References (High Severity):**
   - *Issue Discovered:* Outdated documentation drafts and diagrams referenced Java 21, Spring Boot 3, Spring AI, JPA/Hibernate, and PostgreSQL/PgVector, conflicting with the actual Node.js 22 + Express 4 + SQLite implementation.
   - *Fix Applied:* Removed all stale Java/Spring Boot references across `PRD.md`, `architecture.md`, `README.md`, `backend/README.md`, `db/README.md`, and `AI_1/diagrams/README.md`. Synchronized all documentation with the verified Node.js + Express + SQLite architecture.
2. **DeepSeek API Configuration & Error Handling (High Severity):**
   - *Issue Discovered:* LLM configuration only recognized `TOKENHARBOR_*` keys, and missing keys or rate limits lacked bounded retries, timeout management, or structured error reporting.
   - *Fix Applied:* Updated `backend/src/config.js` and `backend/src/utils/llm.js` to recognize `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, and `DEEPSEEK_MODEL` with seamless TokenHarbor fallback. Implemented 20s timeout protection, 2-stage exponential backoff on HTTP 429/5xx errors, and explicit 503 `NO_LLM_KEY` errors when credentials are unset.
3. **Sparse Catalog Seed Data (Medium Severity):**
   - *Issue Discovered:* Catalog only contained 20 sample products (5 per category), violating the PRD requirement for 10–20 realistic items per category.
   - *Fix Applied:* Expanded `db/seed-data.json` to 52 realistic, highly detailed products (13 per category across Laptops, Smartphones, Home Appliances, and Accessories) with complete specs, prices, and stock counts.
4. **RAG Stop-Word Score Leakage (Medium Severity):**
   - *Issue Discovered:* Common stop-words (e.g. "what", "policy") generated false-positive keyword overlap matches (~0.29 similarity) for out-of-domain queries like corporate jets.
   - *Fix Applied:* Added stop-word filtering in `backend/src/utils/embeddings.js` and calibrated the hybrid retrieval threshold to `0.22`. Irrelevant queries now score < 0.19, correctly returning zero chunks and triggering the `"I don't have enough approved information..."` fallback.
5. **Prompt Dollar-Sign Shell Collision (Low Severity):**
   - *Issue Discovered:* Dollar signs in natural language queries (e.g. `laptop under $1000`) caused empty-string expansion when passed in certain shell contexts. The constraint resolver was strengthened in `backend/src/modules/assistant/routes.js` to treat explicit categories or budgets as product recommendation intents rather than vague clarification requests.

### Remaining Limitations and Production Roadmap
- **Simulated External Integrations:** In line with hackathon scope, carrier tracking numbers (`SIM-TRACK-xxx`) and credit card transactions (`PAID_SIMULATED`) use clean in-process simulation adapters rather than live FedEx/Stripe webhooks.
- **Single-Node In-Memory Rate Limiting:** The rate limiter uses an in-process Map. For multi-instance clustered horizontal scaling, this should be backed by Redis.
- **SQLite Single-Writer Concurrency:** SQLite in WAL mode handles high read concurrency and sequential writes effectively for local and single-server deployments; high-volume multi-region writes would warrant migrating to PostgreSQL.
