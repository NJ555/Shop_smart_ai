# ShopSmart AI — Architecture & System Design Overview

> Derived from `PRD.md` v1.0.0 + `ShopSmartAI_Hackathon_Usecase.docx`.
> Stack constraint: **React 19 + Vite | Java + Spring Boot 3 + Spring AI | PostgreSQL + PgVector**
> Scope: **Hackathon MVP with production-grade architecture. Real payments, real carriers, real WMS are OUT OF SCOPE (simulated).**

---

## Part 1 — Project Summary

### 1.1 Vision
Build **ShopSmart AI**, an autonomous, AI-first e-commerce assistant platform (Amazon-like core capabilities) that provides:

- Natural-language product discovery + explainable, grounded recommendations.
- Accurate policy/warranty/shipping/refund/membership answers from approved documents (RAG).
- Order tracking + shipment visibility.
- Safe, auditable agentic operations for support/fulfillment exceptions.

Not a generic chatbot — a **safe, grounded, explainable commerce platform**.

### 1.2 Problems Solved

| For Customers | For Ops Teams |
|---|---|
| Can't find right product among alternatives | No inventory visibility |
| Unclear delivery dates / shipping costs | Fulfillment exceptions are manual |
| Confusing return/refund/warranty/membership policies | Repeated policy questions = support overload |
| Inconsistent support across channels | No coordination between support / catalog / inventory / fulfillment |
| Slow order-issue resolution | AI decisions not auditable |

### 1.3 Product Goals (North-Star)

| Goal | Meaning |
|---|---|
| Grounded AI | No invented products, prices, specs, stock, or policies |
| Explainability | Every recommendation/answer traceable to source |
| Safe agents | Only explicitly authorized actions via tools |
| Reliability | Deterministic fallback when models/tools fail |
| Hackathon feasibility | E2E flow without real payments/logistics |
| Production readiness | Clean schema, validation, tests, audit, secure APIs |

Hackathon metrics: (1) AI-assisted discovery success rate, (2) Grounded policy answer rate with citations, (3) Simulated checkout completion rate, (4) Agent safety rate (no unauthorized action, all audited).

### 1.4 MVP Scope vs Out-of-Scope

**MVP Must-Have — Customer:**
Registration/login (JWT), catalog browse, category hierarchy, search/filter/sort/pagination, PDP, comparison (≤4), wishlist, cart, preferences, membership display, simulated checkout, order history/tracking, AI shopping assistant, RAG policy assistant.

**MVP Must-Have — AI:**
Constraint extraction/validation, catalog-grounded ranking, explainable responses, document ingestion/versioning, chunking/embeddings (PgVector), hybrid retrieval, grounded generation with citations/confidence, safe fallback, trace logging.

**MVP Must-Have — Ops:**
Admin catalog/inventory/orders/documents/tickets/audit/approvals, simulated order/shipment ops, human approval for sensitive simulated ops.

**Stretch:** coupons, multi-warehouse, personalized ranking/reorder, semantic catalog search, multi-channel consistency, recovery workflows, analytics, a11y/i18n.

**Explicitly Out-of-Scope:** real payment/money movement, real carrier APIs, real warehouse automation, seller onboarding, fraud detection, logistics optimization, multi-currency/tax, native mobile (responsive web is enough).

**Post-hackathon (don't block):** real payments/carriers/WMS, multi-region, Kafka streaming, fraud, seller flows, SOC2/PCI/GDPR hardening, LLM eval pipelines, multi-language, real notifications.

### 1.5 Key Assumptions (A1–A12)

JWT auth; tiers `BASIC/PRIME/PREMIUM`; seeded structured products; central inventory; warehouse via internal/simulated APIs; trusted versioned documents (`version, effectiveDate, category, region`); simulated payment/shipment; configurable/mockable models; English-only, single-region MVP.

### 1.6 Personas & Critical Journeys

**Customers:** Ananya (laptop for Java+AI), Rahul (delivery/returns clarity), Sneha (budget compare/wishlist), Vikram (premium SLA), Meera (plain-language help).
**Ops:** L1 Support, Ops Manager, Catalog Manager, Knowledge Admin, Finance Ops.

Three golden journeys (must demo):
1. **AI Discovery:** login → `Suggest laptop under $1000 for Java+AI` → extract budget/category/use-case → query real catalog → rank → explain (ID/name/reason/availability) → add to cart → checkout → track.
2. **RAG Policy:** `Can I return opened laptop?` → search ACTIVE latest docs → grounded answer + confidence + doc/section/version → fallback if no evidence.
3. **Fulfillment Exception:** shipment delayed → `Where is ORD-123?` → `order.get` + `shipment.track` → factual status → offer eligible cancel (approval if sensitive) → audit trail.

### 1.7 Tech Stack (Normative)

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite, responsive accessible components, React Query / Zustand |
| Backend | Java 21+, Spring Boot 3, Spring AI, Spring Data JPA, Jakarta Validation |
| DB | PostgreSQL 15+ + PgVector (single source of truth: relational + vectors + audit + outbox) |
| Auth | JWT (`sub, roles, iss, exp`, 15–30 min expiry) + RBAC server-side |
| Docs | OpenAPI 3, Flyway/Liquibase, Docker Compose |
| Tests | JUnit, Testcontainers, Playwright/Cypress optional, golden RAG datasets |
| AI | Configurable provider (`mock\|openai\|ollama\|other`), deterministic mock mode for demo |

Roles: `CUSTOMER, SUPPORT_AGENT, OPS_MANAGER, CATALOG_MANAGER, KNOWLEDGE_ADMIN, ADMIN, AGENT_RUNTIME`.

---

## Part 2 — System Design & Architecture

### 2.1 Architecture Style Decision

**Modular monolith** (PRD §4.2–4.3).

Why: easier hackathon run/test, fewer distributed failures, clean module boundaries, decomposable later. Async via Spring events + `outbox_events` table (Kafka-ready).

Key decisions:

| Decision | Rationale |
|---|---|
| Modular monolith | Coherence + low ops overhead |
| Postgres as SSOT | Integrity + vector search in one DB |
| AI must reference real records | Anti-hallucination |
| Tool-based agents only | Safe, explicit, auditable |
| Server-side validation everywhere | Never trust model/client output |
| Simulated externals behind interfaces | Swappable for real systems |
| Mock model adapters | Deterministic live demo |
| Outbox pattern | Future-proof async |

### 2.2 High-Level Architecture

```mermaid
flowchart TB
    subgraph FE["FRONTEND — React 19 + Vite"]
        CS[Customer Store<br/>Search / PDP / Cart / Orders]
        AS[Assistant UI<br/>Shopping + Knowledge Chat]
        SU[Support UI]
        AD[Admin UI<br/>Catalog / Inventory / Docs / Agent Ops]
    end

    subgraph BE["BACKEND — Spring Boot 3 Modular Monolith"]
        subgraph CORE["Domain Modules"]
            ID[identity<br/>auth / profile / membership]
            CAT[catalog + inventory + search]
            ORD[cart + order + shipment<br/>+ fulfillment]
            SUP[support + tickets]
        end
        subgraph AI["AI Layer — Spring AI"]
            SHOP[Shopping Assistant<br/>intent → constraints → rank → explain]
            RAG[Knowledge RAG<br/>ingest → retrieve → ground → cite]
            AGENT[Agent Orchestrator<br/>route → plan → tools → audit]
        end
        subgraph CROSS["Cross-Cutting"]
            AUTHZ[AuthZ / Validation / Idempotency<br/>Rate Limit / Audit / Observability]
        end
        CORE --> AI
        CORE --- CROSS
        AI --- CROSS
    end

    subgraph DATA["DATA — PostgreSQL + PgVector"]
        REL[(Relational<br/>users / catalog / orders / tickets)]
        VEC[(Vectors<br/>knowledge_chunks.embedding)]
        OPS[(Audit / Outbox / Idempotency<br/>agent_runs / audit_logs)]
    end

    FE -- HTTPS / JSON<br/>Bearer JWT --> BE
    BE -- JPA / JDBC / pgvector --> DATA
```

### 2.3 Module Boundaries

```mermaid
flowchart LR
    subgraph MOD["Backend Modules"]
        identity[identity]
        catalog[catalog]
        inventory[inventory]
        search[search]
        wishlist[wishlist]
        cart[cart]
        order[order]
        shipment[shipment]
        support[support]
        knowledge[knowledge]
        assistant[assistant]
        agent[agent]
        admin[admin]
        audit[audit]
    end
    identity --> catalog
    catalog --> inventory
    inventory --> cart
    cart --> order
    order --> shipment
    order --> support
    knowledge --> assistant
    catalog --> assistant
    order --> agent
    shipment --> agent
    inventory --> agent
    knowledge --> agent
    agent --> audit
    order --> audit
```

| Module | Responsibility |
|---|---|
| `identity` | Users, JWT, roles, preferences, membership |
| `catalog` | Categories, products, attributes, images |
| `inventory` | Stock, reservations, availability |
| `search` | Filter/sort/pagination/text search |
| `wishlist` | Saved items |
| `cart` | Items, validation, price re-check |
| `order` | Checkout + lifecycle |
| `shipment` | Lifecycle + simulated carrier events |
| `support` | Tickets, conversations, escalations |
| `knowledge` | Docs, chunks, embeddings, RAG |
| `assistant` | Shopping orchestration |
| `agent` | Tool execution workflows |
| `admin` | Internal actions |
| `audit` | AI + ops action logs |

### 2.4 Data Design (Simplified ER)

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    USERS ||--o{ CARTS : owns
    USERS ||--o{ WISHLISTS : owns
    USERS ||--o{ CUSTOMER_PREFS : has
    CATEGORIES ||--o{ PRODUCTS : contains
    CATEGORIES ||--o{ CATEGORIES : parent
    PRODUCTS ||--o{ PRODUCT_ATTRS : has
    PRODUCTS ||--o{ PRODUCT_IMAGES : has
    PRODUCTS ||--o{ INVENTORY_LEVELS : stocked
    WISHLISTS ||--o{ WISHLIST_ITEMS : holds
    WISHLIST_ITEMS }o--|| PRODUCTS : ref
    CARTS ||--o{ CART_ITEMS : holds
    CART_ITEMS }o--|| PRODUCTS : ref
    ORDERS ||--o{ ORDER_ITEMS : holds
    ORDER_ITEMS }o--|| PRODUCTS : snapshot
    ORDERS ||--o{ SHIPMENTS : ships
    SHIPMENTS ||--o{ SHIPMENT_EVENTS : logs
    ORDERS ||--o{ REFUNDS : refunds
    SUPPORT_TICKETS ||--o{ SUPPORT_MSGS : threads
    KNOWLEDGE_DOCS ||--o{ KNOWLEDGE_CHUNKS : chunked
    ASSIST_CONVS ||--o{ ASSIST_MSGS : threads
    AGENT_RUNS ||--o{ AGENT_TOOL_CALLS : calls

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string role
        string membership_tier
    }
    PRODUCTS {
        uuid id PK
        string slug UK
        uuid category_id FK
        string brand
        numeric price
        numeric rating
        bool is_active
    }
    INVENTORY_LEVELS {
        uuid product_id PK
        int available_qty
        int reserved_qty
        int version
    }
    ORDERS {
        uuid id PK
        string order_number UK
        string status
        numeric total
        string idempotency_key UK
    }
    KNOWLEDGE_CHUNKS {
        uuid id PK
        uuid document_id FK
        text content
        vector embedding
        jsonb metadata
    }
```

Core invariants:

- `inventory_levels.available_quantity >= 0`; checkout does `SELECT ... FOR UPDATE` (MVP) or optimistic `version` + retry; cancellation releases reservation; never oversell.
- Pricing: never trust client totals; server recalculates; order stores snapshot; post-checkout price changes don't mutate orders.
- RAG: only `status=ACTIVE` latest `effectiveDate` docs by default; `SUPERSEDED/ARCHIVED` excluded unless historical query; region/category filtered.
- AI grounding: shopping IDs/prices/stock must exist in DB; knowledge answers require citations or `NONE` fallback; agents can't claim success without tool success.

### 2.5 API Surface (`/api/v1`, JSON, RFC7807 errors, `Idempotency-Key`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login` |
| Catalog | `GET /categories`, `GET /products/search?...`, `GET /products/{id}`, `GET /products/compare?ids=` |
| Wishlist/Cart | `GET/POST/DELETE /wishlist...`, `GET /cart`, `POST/PUT/DELETE /cart/items...` |
| Orders | `POST /orders` (idempotent), `GET /orders`, `GET /orders/{id}`, `POST /orders/{id}/cancel` |
| Shipment | `GET /orders/{id}/shipment` |
| AI | `POST /assistant/shopping/query`, `POST /assistant/knowledge/query`, `POST /assistant/ops/query`, `POST /agent/actions/execute` |
| Admin | `POST /admin/knowledge/documents` (multipart), `POST .../activate`, `POST /admin/inventory/{id}/adjust` |

Standard error:
```json
{"type":"https://shopsmart.ai/errors/validation","title":"Invalid request","status":400,"detail":"budget must be > 0","instance":"/api/v1/assistant/shopping/query","traceId":"trace_123"}
```

### 2.6 Events (Outbox → future Kafka)

```mermaid
flowchart LR
    OS[Order Service<br/>order.created<br/>order.cancelled] --> OB[(outbox_events<br/>PENDING→SENT/FAILED)]
    SS[Shipment Service<br/>shipment.status_changed] --> OB
    IS[Inventory Service<br/>inventory.reserved/released] --> OB
    KS[Knowledge Service<br/>knowledge.document_published] --> OB
    AR[Agent Runtime<br/>agent.action_completed] --> OB
    OB --> SHIP_SIM[Shipment Simulation]
    OB --> AUD[Audit / UI refresh]
    OB --> SUP_UPD[Support view]
```

### 2.7 Cross-Cutting: Security, Observability, Reliability

```mermaid
flowchart TB
    REQ[HTTP Request] --> AUTH[Auth Filter<br/>JWT + RBAC]
    AUTH --> RL[Rate Limit<br/>auth / assistant / orders]
    RL --> VAL[Jakarta Validation<br/>DTOs, no mass assignment]
    VAL --> SVC[Domain Service<br/>ownership + state-machine checks]
    SVC --> IDEM[Idempotency<br/>checkout / cancel / refund / tools]
    SVC --> AUDIT[Audit Log<br/>before/after + traceId]
    SVC --> TRACE[Trace<br/>conversationId / model I-O / latency]
    AUDIT --> RESP[Response<br/>RFC7807 on error]
    TRACE --> RESP
```

- Auth: bcrypt/argon2, no secrets in logs, CORS locked to FE origin, secure headers, ownership checks (customers see own orders only).
- AI safety: prompt-injection guard, output schema validation, tool allowlist, human approval for refunds > threshold / doc publish / inventory adjust / pricing changes, citation enforcement, `NO_EVIDENCE` fallback, no direct DB mutation by model, post-validation before UI.
- Observability: logs with `traceId` (API/AI/tools/approvals, no passwords/tokens/PII); metrics (latency, error rate, orders created/cancelled, stockouts, model timeout/malformed rate, RAG hit/no-evidence/confidence, agent tool/approval/escalation rates); AI traces (query, sanitized query, product IDs/chunks, raw + validated output, latency, error).
- Reliability: idempotency everywhere mutating; transactional checkout+inventory; graceful AI fallback; never silently succeed; explicit failure > fabricated answer.

### 2.8 Deployment (Local MVP)

```mermaid
flowchart LR
    DEV[Dev Machine] --> DC[Docker Compose<br/>postgres:15 + pgvector]
    DEV --> BE_RUN[Backend<br/>./mvnw spring-boot:run :8080]
    DEV --> FE_RUN[Frontend<br/>npm run dev :5173]
    BE_RUN --> DC
    FE_RUN -- VITE_API_BASE_URL<br/>http://localhost:8080/api/v1 --> BE_RUN
    ENV[env: SPRING_DATASOURCE_URL<br/>AI_PROVIDER=mock|openai|ollama<br/>EMBEDDING_PROVIDER<br/>JWT_SECRET] -.-> BE_RUN
```

Seed: 3 categories, 20+ products (5 laptops/5 phones/5 appliances/5 accessories), 3 users + support/admin, 3+ policy docs, 2 orders, 1 shipment. `AI_PROVIDER=mock` → deterministic vectors/extraction for demo.

---

## Part 3 — Workflow Overview (End-to-End Flows)

### 3.1 Master Customer Journey

```mermaid
flowchart TD
    A[Login / Register<br/>JWT issued] --> B{Browse or Ask AI?}
    B -- Browse --> C[Search / Filter / Sort / Paginate]
    C --> D[PDP<br/>price / attrs / availability / ETA]
    D --> E[Compare ≤4 / Wishlist]
    B -- Ask AI --> F[Shopping Assistant<br/>§3.2]
    F --> E
    E --> G[Cart<br/>revalidate price+stock]
    G --> H[Simulated Checkout<br/>idempotent]
    H --> I[Order CREATED→CONFIRMED<br/>inventory reserved]
    I --> J[Shipment PENDING→...→DELIVERED]
    J --> K[Order History + Tracking UI]
    K --> L{Issue?}
    L -- Policy Q --> M[Knowledge Assistant §3.3]
    L -- Order problem --> N[Ops Agent §3.4]
    L -- No --> DONE[Done]
```

### 3.2 Workflow A — AI Shopping Assistant Pipeline

PRD §6.3 pipeline; deterministic weighted ranking (budget 30%, attribute/use-case 30%, rating 20%, availability 10%, preference 10%; preferences never override hard constraints).

```mermaid
flowchart TD
    Q[User Query<br/>e.g. laptop under $1000 Java+AI] --> SAN[Sanitize + Injection Guard]
    SAN --> INT[Intent Classification]
    INT --> EXT[Constraint Extraction<br/>JSON: intent/category/budget/useCases/attrs]
    EXT --> VAL[Constraint Validation<br/>bad budget→400 / conflict→clarify]
    VAL --> QB[Catalog Query Builder<br/>validated filters only]
    QB --> RET[Product Retrieval<br/>PostgreSQL only, no model objects]
    RET --> RANK[Ranking / Scoring<br/>deterministic weights]
    RANK --> EXP[Explanation Builder<br/>facts only: attrs/price/rating/stock]
    EXP --> RESP_VAL[Response Validation<br/>IDs+prices+stock exist in DB?]
    RESP_VAL -- pass --> OUT[Final JSON<br/>recommendations + traceId]
    RESP_VAL -- fail/timeout/hallucination --> FB[Fallback<br/>clarify or no-results + suggestions]
    RET -- 0 rows --> FB
    VAL -- ambiguous --> CLAR[Clarifying Question]
```

Example constraint JSON → catalog filter → response contract in PRD §6.4/§6.9. Anti-hallucination: discard any product object not in DB; never claim purchase without order API result; forbid `best-in-class/guaranteed` style claims.

### 3.3 Workflow B — RAG Knowledge Assistant (Ingest + Answer)

```mermaid
flowchart TD
    subgraph INGEST["Ingestion (offline/admin)"]
        UP[Upload PDF/MD/JSON<br/>+ metadata] --> META[Metadata Validation<br/>title/category/version/effectiveDate/region]
        META --> PARSE[Parse<br/>PDF extract / MD normalize / JSON flatten]
        PARSE --> NORM[Normalize<br/>keep headings + refs]
        NORM --> CHUNK[Chunk 600-900 tok<br/>overlap 80-120, section-aware]
        CHUNK --> EMB[Embed]
        EMB --> STORE[(PgVector store<br/>chunk + embedding + version/region)]
        STORE --> PUB[Activate → SUPERSEDE old]
    end
    subgraph ANSWER["Answer (online)"]
        Q2[User Q<br/>Can I return opened laptop?] --> HYB[Hybrid Retrieval<br/>vector + keyword + metadata filter<br/>ACTIVE + latest + region/category<br/>topK=5 + threshold]
        HYB --> EVID{Evidence?}
        EVID -- yes --> GEN[Grounded Generation<br/>only from chunks, cite IDs<br/>conflict→latest date + LOW]
        EVID -- no --> FALL[Safe Fallback<br/>confidence NONE + NO_EVIDENCE log]
        GEN --> CONF[Confidence HIGH/MED/LOW<br/>+ doc/section/version/chunkId]
    end
    PUB -.-> HYB
```

Confidence policy: HIGH → answer; MEDIUM → answer with caveat; LOW → cautious + escalation suggestion; NONE → `I don't have enough approved information...` + `followUpRequired:true`. Same service backs customer chat + support console for consistency.

### 3.4 Workflow C — Agentic Operations (Orchestrator + Tools)

```mermaid
flowchart TD
    REQ[User/Support Request<br/>Where is ORD-123? / Cancel it] --> ORCH[Orchestrator<br/>intent route + plan + safety]
    ORCH --> OA[Order Support Agent]
    ORCH --> SA[Shipment Tracking Agent]
    ORCH --> KA[Knowledge Agent]
    ORCH --> IA[Inventory Agent]
    ORCH --> FA[Fulfillment Exception Agent]
    ORCH --> EA[Escalation Agent]
    OA & SA & KA & IA & FA & EA --> TOOL[Tool Execution Layer<br/>schema + authZ + timeout/retry + idempotency + audit]
    TOOL --> DOM[Domain Services<br/>order / shipment / inventory / support]
    DOM --> TOOL
    TOOL --> APPR{Sensitive?<br/>refund>threshold / doc publish<br/>inventory / pricing}
    APPR -- yes --> HUMAN[Human Approval<br/>admin console]
    HUMAN -- approved --> EXEC[Execute]
    HUMAN -- denied --> STOP[Stop + notify]
    APPR -- no --> EXEC
    EXEC --> AUD[Audit: runId/intent/tools I-O/trace/approval]
```

MVP tools: `customer.get_profile, order.get, order.list_by_customer, shipment.track, inventory.check, order.cancel_simulated, refund.create_simulated, support.ticket.create, support.escalate, fulfillment.flag_exception, catalog.search_alternatives` — each with name/desc/role/JSON I-O schema/timeout/retry/error taxonomy. Timeouts: reads 2s+2 retries, writes 5s+1 retry if idempotent, models 10s+1, embeddings 5s+1. Agent never touches DB directly; output post-validated.

Sequence — tracking + cancel:

```mermaid
sequenceDiagram
    autonumber
    actor U as Customer / Support
    participant O as Orchestrator
    participant T as Tool Layer
    participant D as Domain (Order/Shipment)
    participant H as Approver (Admin)

    U->>O: Where is ORD-123? Can I cancel?
    O->>T: order.get {orderId}
    T->>D: fetch order
    D-->>T: status CREATED + items
    O->>T: shipment.track {orderId}
    T->>D: fetch shipment
    D-->>T: IN_TRANSIT + ETA
    O-->>U: Factual status + ETA + eligibility
    alt eligible & approval required
        O->>H: PENDING_APPROVAL cancel request
        H-->>O: approved
        O->>T: order.cancel_simulated {orderId + idempotencyKey}
        T->>D: cancel + release stock + simulated refund
        D-->>T: CANCELLED
        O-->>U: Confirmed with audit trace
    else not eligible (SHIPPED)
        O-->>U: Reject with reason (already shipped)
    end
```

### 3.5 Workflow D — Simulated Checkout → Fulfillment (Happy + Failure)

```mermaid
sequenceDiagram
    autonumber
    actor U as Customer
    participant F as Frontend
    participant C as Cart/Order API
    participant I as Inventory
    participant O as Outbox/Shipment Sim

    U->>F: Place order (cartId + address)
    F->>C: POST /orders + Idempotency-Key
    C->>C: Validate cart + recalc totals (ignore client total)
    C->>I: SELECT FOR UPDATE + reserve/decrement
    alt stock OK
        C->>C: Create order + snapshots + PAID_SIMULATED
        C->>O: order.created event
        O->>O: Create shipment + LABEL_CREATED→IN_TRANSIT...
        C-->>F: 201 {orderId, ORD-xxx, total}
    else out of stock / price changed
        C-->>F: 409/422 mark item invalid + updated price
    else duplicate key
        C-->>F: 200 original order (no double charge)
    end
```

State machines:

```mermaid
stateDiagram-v2
    [*] --> CREATED
    CREATED --> CONFIRMED : simulated payment
    CREATED --> CANCELLED : cancel pre-confirm
    CONFIRMED --> PROCESSING : fulfillment begins
    PROCESSING --> SHIPPED : shipment created
    SHIPPED --> OUT_FOR_DELIVERY
    OUT_FOR_DELIVERY --> DELIVERED
    CONFIRMED --> CANCELLED
    PROCESSING --> CANCELLED : only if not shipped
    DELIVERED --> [*]
    CANCELLED --> [*]
```

```mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> LABEL_CREATED
    LABEL_CREATED --> IN_TRANSIT
    IN_TRANSIT --> OUT_FOR_DELIVERY
    OUT_FOR_DELIVERY --> DELIVERED
    IN_TRANSIT --> DELAYED
    DELAYED --> IN_TRANSIT
    DELIVERED --> [*]
```

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> ACTIVE : publish
    ACTIVE --> SUPERSEDED : new version active
    SUPERSEDED --> ARCHIVED
```

Cart: `ACTIVE → CHECKED_OUT | ABANDONED`. Refund (simulated): `REQUESTED → APPROVED → COMPLETED`, idempotent, `amount ≤ paid`.

### 3.6 Failure & Recovery Map (PRD §15, 54 cases compressed)

| Domain | Detect → Recover |
|---|---|
| Search | invalid filters → 400; 0 rows → empty state + assistant prompt; disabled-in-cart → mark invalid |
| Checkout | OOS → 409 + fix cart; price change → show server price; duplicate → return original; concurrent oversell → lock/version rejects late txn; shipment-sim fail → retry, order stays valid |
| Order/shipment | inconsistent state → reconcile via state machine; dup shipment → return existing; cancel-after-ship → reject; dup cancel/refund → idempotency |
| AI | timeout/malformed/hallucinated product/missing citation → retry once → fallback; contradiction → LOW + admin queue; embedding down → disable RAG gracefully; injection → sanitize + ignore |
| Agent/tools | timeout/malformed/unauthorized/partial → block + audit + escalate; approval denied → stop + notify; success claimed without tool success → block |
| Security | expired JWT → 401; wrong role/owner → 403/404; replayed mutation → idempotent replay |

Principles: never silently succeed; explicit failure > fabrication; human escalation for ambiguity; full trace for every AI/agent action.

### 3.7 UI Map → Workflows

Customer: Home (search + category chips + AI entry) → Results (filters/sort/cards/pagination) → PDP (gallery/attrs/availability/ETA/cart/wishlist/compare) → Compare (≤4 side-by-side) → Wishlist → Cart (qty/validation/warnings) → Checkout (address + simulated pay + idempotent submit) → History/Detail (status badge, timeline, cancel-if-eligible, support) → Assistant panels (shopping cards + reasons + add-to-cart; knowledge answer + confidence + citations).
Admin/Ops: catalog CRUD + attributes/images, inventory adjust + reservations, order search/detail/cancel/refund/flag, doc upload/metadata/chunk preview/activate/contradiction review, agent runs/tool inspector/approval queue.
Support console reuses same RAG service + order context + recommended actions + escalate.

### 3.8 NFRs, Tests, Roadmap, Demos

**NFR targets:** search p95 <500ms, PDP/cart <300ms, order <1s, shopping AI <5s, knowledge <7s, initial load <3s; indexes on filter cols + HNSW/IVFFlat on embeddings; pagination everywhere; no N+1; DTOs ≠ entities; centralized errors; WCAG basics (keyboard, focus, labels, contrast).

**Tests:** unit (services/validators/state machines) → integration (API+DB+AI mocks) → E2E (register→search→cart→checkout→track; assistant grounded; RAG cited; agent approval/idempotency) → golden RAG sets (20 policy + 5 manual + 5 no-answer + 3 contradiction + 3 outdated). Sign-off = 15 PRD §20.4 criteria (auth, search, compare, wishlist/cart, checkout, tracking, both assistants, missing-evidence fallback, agent lookup + 1 audited mutation, admin CRUD, authZ, tests, setup).

**Roadmap:** P1 MVP (above) → P2 stretch (coupons, personalization, semantic search, multi-warehouse, richer recovery, embedded support chat, analytics) → P3 production (real payments/carriers/WMS, Kafka, multi-region, eval pipelines, compliance, notifications, sellers).

**Live demos (5):** (1) laptop query → recommend → cart → order; (2) opened-laptop return → cited answer → unsupported Q → fallback; (3) `Where is ORD-123? Can I cancel?` → timeline + eligibility; (4) admin price edit + restock + audit + doc versioning; (5) malformed-model fallback + duplicate checkout + blocked unauthorized action.

---

## Appendix — File / Repo Map (Proposed)

```text
shopsmart-ai/
  backend/  src/main/java/... (identity|catalog|inventory|search|cart|order|shipment|support|knowledge|assistant|agent|admin|audit)
            src/main/resources/ (migrations, prompts, seeds)
  frontend/ src/ (store|assistant|support|admin|api client)
  docker-compose.yml   seed/   docs/ (this file + OpenAPI)
```

**Definition of done:** working FE+BE, seeded DB, this diagram doc, setup instructions, live demo of both assistants + tracking + 1 safe agent action, proper schema/validation/errors, clean structure, tests/plan, simulated-vs-real statement.

*Source: PRD §§1–24 + hackathon use-case doc. Simulated = `PAID_SIMULATED`, `SIM-TRACK-*`, mock carrier/WMS; production swap behind interfaces.*
