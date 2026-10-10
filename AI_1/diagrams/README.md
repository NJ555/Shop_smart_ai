# ShopSmart AI — Complete System Design Diagram Suite

> **Production-Minded System Architecture, Workflows, Data Models, AI Pipelines, Security Boundaries, and Failure Recovery Playbooks**  
> **Document Reference:** [PRD.md](../../PRD.md) (v1.0.0) | **Scope:** MVP (Node.js Modular Monolith with In-Process Outbox & Simulated Boundaries)

---

## 1. Executive Architecture Summary

**ShopSmart AI** is an autonomous e-commerce assistant platform designed with a **modular monolith** backend in **Node.js 22 + Express 4.19**, responsive storefronts in **Next.js 14** (web) and **React Native / Expo** (mobile), persistence in **SQLite 3 (WAL Mode)** with in-process vector similarity search, and cloud **DeepSeek AI** integration (`deepseek-v4.1-flash:free`).

### Core Engineering Invariants
1. **Catalog & Grounding Invariant:** AI recommendations and policy answers are strictly grounded in genuine SQLite catalog records and 128-dimensional L2-normalized vector chunks. Zero invented products, prices, specifications, or policies.
2. **Atomic Inventory & Concurrency:** Concurrency control utilizes atomic database transaction boundaries and stock checks (`available_quantity >= requested_quantity`) during checkout transactions to prevent stock overselling.
3. **Controlled Agent Boundaries:** Operational AI agents execute actions exclusively through strongly typed domain tools with strict schema validation, role-based allowlists, idempotency keys, and human-in-the-loop approval gates.
4. **Scope Isolation:** Real payment processing, carrier integrations, and physical warehouses remain out of hackathon scope and are modeled as clean simulated boundaries (`PAID_SIMULATED`, simulated tracking numbers `SIM-TRACK-xxx`).

---

## 2. Master Diagram Inventory (15 Scalable Vector Graphics in Order)

All diagrams are consolidated in **one single folder in exact numerical order** (`01` through `15`) as clean, high-resolution Scalable Vector Graphics (`.svg`):

| # | Diagram Title | Direct File Link | PRD Sections Covered | Scope Classification |
|---|---|---|---|---|
| **01** | **System Architecture Overview (Modular Monolith)** | [01_system_overview.svg](01_system_overview.svg) | §4.1 – §4.5, §10, §22 | **MVP** |
| **02** | **Local & Container Deployment Architecture** | [02_deployment_infrastructure.svg](02_deployment_infrastructure.svg) | §4.4, §22.1 – §22.6 | **MVP** |
| **03** | **MVP vs. Post-Hackathon Evolution** | [03_mvp_vs_evolution.svg](03_mvp_vs_evolution.svg) | §2.1 – §2.4, §4.2, §23 | **MVP vs FUTURE** |
| **04** | **Customer End-to-End Experience Journey** | [04_customer_journey.svg](04_customer_journey.svg) | §3.1 – §3.3, §5.1 – §5.9 | **MVP** |
| **05** | **Atomic Checkout & Stock Reservation Sequence** | [05_checkout_sequence.svg](05_checkout_sequence.svg) | §5.8, §5.9, §11.6, §14.1, §15.2 | **MVP** |
| **06** | **Async Events & Transactional Outbox Pattern** | [06_async_events_outbox.svg](06_async_events_outbox.svg) | §4.5, §10.2, §12.1 – §12.3, §23.3 | **MVP (EVENT-READY)** |
| **07** | **10-Stage AI Shopping Assistant Pipeline** | [07_shopping_assistant_pipeline.svg](07_shopping_assistant_pipeline.svg) | §6.1 – §6.11, §14.6, App A | **MVP (GROUNDED)** |
| **08** | **RAG Knowledge Ingestion & Hybrid Retrieval** | [08_rag_knowledge_pipeline.svg](08_rag_knowledge_pipeline.svg) | §7.1 – §7.16, §13.5, App B | **MVP (GROUNDED RAG)** |
| **09** | **Agentic Operations Architecture & Controlled Tools** | [09_agentic_operations.svg](09_agentic_operations.svg) | §8.1 – §8.15, §11.11, App C | **MVP (CONTROLLED)** |
| **10** | **Complete Database ERD & Relational Schema** | [10_entity_relationship_diagram.svg](10_entity_relationship_diagram.svg) | §10.1, §10.2 | **MVP SCHEMA** |
| **11** | **Unified Lifecycle State Machines Suite** | [11_lifecycle_state_machines.svg](11_lifecycle_state_machines.svg) | §13.1 – §13.5, §14.4 – §14.5 | **MVP STATE MACHINES** |
| **12** | **Security Trust Boundaries & RBAC Matrix** | [12_security_rbac_trust_boundaries.svg](12_security_rbac_trust_boundaries.svg) | §5.1, §8.9 – §8.10, §18.1 – §18.6 | **MVP (SECURITY)** |
| **13** | **AI Safety, Anti-Hallucination & Guardrails** | [13_ai_safety_guardrails.svg](13_ai_safety_guardrails.svg) | §6.10, §7.16, §8.14, §18.4, App B & C | **MVP (AI SAFETY)** |
| **14** | **Failure Modes & Recovery Playbooks Architecture** | [14_failure_modes_and_recovery.svg](14_failure_modes_and_recovery.svg) | §14, §15.1 – §15.9 | **MVP (FAULT TOLERANT)** |
| **15** | **Observability, AI Traces & Testing Strategy** | [15_observability_audit_eval.svg](15_observability_audit_eval.svg) | §19.1 – §19.4, §20.1 – §20.4, §21 | **MVP (TESTED)** |

---

## 3. Directory Layout

The workspace has been organized so that all SVG images sit together in **one folder in right order**, alongside the markdown documentation files:

```text
c:\Shop_smart_ai\
├── PRD.md                                           # Master Product Requirements Document
├── architecture.md                                  # System architecture summary & design notes
├── explanation.md                                   # Comprehensive codebase audit & reference
│
└── AI_1/
    └── diagrams/                                    # All 15 SVGs in one folder in right order
        ├── README.md                                # Diagram suite catalog & architectural descriptions
        ├── 01_system_overview.svg
        ├── 02_deployment_infrastructure.svg
        ├── 03_mvp_vs_evolution.svg
        ├── 04_customer_journey.svg
        ├── 05_checkout_sequence.svg
        ├── 06_async_events_outbox.svg
        ├── 07_shopping_assistant_pipeline.svg
        ├── 08_rag_knowledge_pipeline.svg
        ├── 09_agentic_operations.svg
        ├── 10_entity_relationship_diagram.svg
        ├── 11_lifecycle_state_machines.svg
        ├── 12_security_rbac_trust_boundaries.svg
        ├── 13_ai_safety_guardrails.svg
        ├── 14_failure_modes_and_recovery.svg
        ├── 15_observability_audit_eval.svg
        └── svg/                                     # Dedicated mirrored SVG folder
```

---

## 4. Detailed Architectural Descriptions

### 01. System Overview (Modular Monolith)
- **File:** [`01_system_overview.svg`](01_system_overview.svg)
- **Purpose:** Illustrates the high-level system topology, module decomposition, and communication interfaces.
- **Key Modules:**
  - *Frontend:* Next.js 14 web storefront & React Native (Expo) mobile client.
  - *Backend Modules:* `identity`, `catalog`, `search`, `wishlist`, `cart`, `order`, `shipment`, `support`, `admin`, `audit`, and `outbox`.
  - *AI Subsystem:* Shopping Assistant Orchestrator, Knowledge RAG Engine (128-dim cosine + keyword overlap), Agentic Tool Runtime, and DeepSeek LLM (`deepseek-v4.1-flash:free`).
  - *Persistence:* SQLite 3 database with WAL mode housing relational tables and serialized JSON vector embeddings.
  - *Boundaries:* Explicit simulated logistics and payment adapters behind clean domain interfaces.

### 02. Deployment & Local Infrastructure
- **File:** [`02_deployment_infrastructure.svg`](02_deployment_infrastructure.svg)
- **Purpose:** Specifies local development port bindings, runtime configuration, and seed scripts.
- **Components:**
  - `frontend-web`: Next.js 14 server on port `3000`.
  - `frontend-app`: React Native Expo dev client on port `8081`.
  - `backend`: Node.js 22 / Express 4.19 API server on port `4000`.
  - `db`: Local SQLite 3 file (`db/shopsmart.db`) in WAL mode with Foreign Key enforcement.
  - `seed`: Automatic database initialization via `backend/src/seed/seed.js` loading `db/schema.sql`, `db/seed-data.json`, and `db/knowledge_docs/`.
  - `AI_PROVIDER`: DeepSeek (`deepseek-v4.1-flash:free` via TokenHarbor / OpenAI-compatible endpoint).

### 03. MVP vs. Post-Hackathon Evolution
- **File:** [`03_mvp_vs_evolution.svg`](03_mvp_vs_evolution.svg)
- **Purpose:** Clarifies what is implemented for the hackathon MVP versus how the architecture evolves in production.
- **Contrast Matrix:**
  - *MVP:* Node.js/Express modular monolith, in-process outbox event dispatcher, transactional outbox table, local SQLite 3 in WAL mode, simulated payment/carrier events.
  - *Post-Hackathon:* Decomposed microservices on Kubernetes, distributed Apache Kafka event backbone, real Stripe/Adyen payment gateways with 3DS webhooks, real FedEx/UPS APIs, multi-region PostgreSQL with pgvector replication.

### 04. Customer End-to-End Journey
- **File:** [`04_customer_journey.svg`](04_customer_journey.svg)
- **Purpose:** Maps the customer experience across 7 unified lifecycle stages.
- **Stages:**
  1. *Authentication & Tiers:* User registration, login, JWT issuance, preference loading, and tier display (`BASIC`, `PRIME`, `PREMIUM`).
  2. *Catalog Discovery:* Category hierarchy browsing, keyword search, faceted filters (price, brand, rating, availability).
  3. *AI Shopping Consultation:* Natural-language query, constraint extraction, catalog-grounded suggestions with reasons.
  4. *Evaluation:* PDP galleries, 4-way side-by-side spec comparison, persistent wishlist.
  5. *Cart Assembly:* Stock cap validation, real-time price rechecks, line item management.
  6. *Atomic Checkout:* Server-recalculated totals, inventory reservation, simulated payment, unique order ID (`ORD-xxx`).
  7. *Tracking & Support:* Shipment timeline (`LABEL_CREATED` -> `IN_TRANSIT` -> `DELIVERED`), pre-shipment cancellation, and RAG policy help.

### 05. Atomic Checkout & Stock Reservation Sequence
- **File:** [`05_checkout_sequence.svg`](05_checkout_sequence.svg)
- **Purpose:** Details the database transaction boundary, concurrency locks, and idempotency guarantees during checkout.
- **Sequence Highlights:**
  - *Idempotency Check:* Checks `idempotency_keys` table; replayed requests immediately return cached order response without double billing.
  - *Price Revalidation:* Server recalculates subtotals; rejects stale or manipulated client-side prices.
  - *Stock Verification:* Executes transactional check on available inventory. If stock is insufficient, triggers rollback and returns `409 Conflict`.
  - *Atomic Commit:* Simultaneously inserts `orders`, `order_items` snapshots, updates `carts` to `CHECKED_OUT`, decrements inventory, and inserts an `order.created` record into `outbox_events`.

### 06. Async Events & Transactional Outbox Pattern
- **File:** [`06_async_events_outbox.svg`](06_async_events_outbox.svg)
- **Purpose:** Demonstrates how internal asynchronous events are processed reliably without dual-write risks.
- **Flow:**
  - Domain operations insert both domain entity and `outbox_events` row (`status = 'PENDING'`) in a single commit.
  - In-process poller queries pending outbox records and publishes to domain event handlers.
  - Dispatches to decoupled listeners: `ShipmentSimulator` (`order.created`), `InventoryReconciliation` (`order.cancelled`), `KnowledgeReIndexer` (`knowledge.document_published`), and `AuditStreamHandler` (`agent.action_completed`).

### 07. 10-Stage AI Shopping Assistant Pipeline
- **File:** [`07_shopping_assistant_pipeline.svg`](07_shopping_assistant_pipeline.svg)
- **Purpose:** Illustrates the end-to-end pipeline from natural language shopper query to grounded product cards.
- **10 Stages:**
  1. *User Query:* `POST /api/v1/assistant/shopping/query`
  2. *Input Sanitization & Prompt Guard:* Strips control tokens, isolates inputs in delimiter tags.
  3. *Intent Classification:* Differentiates shopping intent from policy queries or chit-chat.
  4. *Constraint Extraction:* Structured JSON extraction (category, budget, RAM, storage, CPU).
  5. *Constraint Validation:* Validates against active catalog taxonomy; triggers clarifying questions on ambiguity.
  6. *Catalog Query Builder:* Builds dynamic SQLite query filtering real products with price <= budget.
  7. *Database Product Retrieval:* Fetches real records only. Zero LLM product invention.
  8. *Deterministic Weighted Ranking:* 100% hard match, 30% budget fit, 30% spec fit, 20% rating, 10% availability, 10% user preferences.
  9. *Factual Explanation Builder:* Formulates reasons using only database attributes; bans promotional superlatives.
  10. *Response Delivery & Trace:* Strongly typed JSON schema validation, trace ID attachment, UI product cards returned.

### 08. RAG Knowledge Ingestion & Hybrid Retrieval
- **File:** [`08_rag_knowledge_pipeline.svg`](08_rag_knowledge_pipeline.svg)
- **Purpose:** Architecture of the version-aware enterprise policy assistant.
- **Two Pipeline Streams:**
  - *Stream 1 (Ingestion):* Markdown/Policy docs -> Parses headings -> Chunks text (200-400 words) -> Generates 128-dim L2-normalized vectors via hashed TF pipeline -> Stores in SQLite `knowledge_chunks` with JSON serialization -> Admin activates document (`DRAFT` -> `ACTIVE`; marks old version `SUPERSEDED`).
  - *Stream 2 (Retrieval):* User/Support query -> Hybrid cosine similarity search + keyword overlap with stop-word suppression -> Mandatory metadata filter (`status = 'ACTIVE'`, latest `effectiveDate`, `region`) -> Similarity threshold check (`score >= 0.22`; if below, returns safe fallback with `confidence: NONE`) -> Grounded answer with citation packaging (document title, section, version, chunk ID).

### 09. Agentic Operations Architecture & Tools
- **File:** [`09_agentic_operations.svg`](09_agentic_operations.svg)
- **Purpose:** Details how operational AI agents execute simulated actions safely.
- **Key Modules:**
  - *Orchestrator Agent:* Goal decomposition, user role boundary verification, tool dispatch.
  - *Domain Agents:* Order Support Agent, Shipment Tracking Agent, Inventory Agent, Knowledge Agent, Escalation Agent.
  - *Tool Execution Layer:* Strict tool allowlists per role, JSON schema validation, timeout/retry enforcement.
  - *Human-in-the-Loop Approval Gate:* Actions classified as sensitive (simulated refunds > $100, manual inventory adjustments, policy publishing) enter `PENDING_APPROVAL` status and require Admin Console sign-off.
  - *Anti-Falsehood Guard:* Agent cannot claim purchase or cancellation success unless underlying domain service confirms execution.

### 10. Complete Database ERD & Relational Schema
- **File:** [`10_entity_relationship_diagram.svg`](10_entity_relationship_diagram.svg)
- **Purpose:** Full relational schema across 17 database tables, primary/foreign keys, and data ownership.
- **Entity Clusters:**
  - *Identity:* `users`, `customer_preferences`
  - *Catalog & Inventory:* `categories`, `products`, `product_attributes`, `product_images`, `inventory_levels` (with `version` lock)
  - *Commerce:* `wishlists`, `wishlist_items`, `carts`, `cart_items`
  - *Orders & Logistics:* `orders`, `order_items` (with frozen price/attribute snapshots), `shipments`, `shipment_events`, `refunds`
  - *Support:* `support_tickets`, `support_messages`
  - *Knowledge Vector:* `knowledge_documents`, `knowledge_chunks` (with serialized JSON `embedding` column)
  - *AI & Operational State:* `assistant_conversations`, `assistant_messages`, `agent_runs`, `agent_tool_calls`, `audit_logs`, `idempotency_keys`, `outbox_events`

### 11. Unified Lifecycle State Machines Suite
- **File:** [`11_lifecycle_state_machines.svg`](11_lifecycle_state_machines.svg)
- **Purpose:** State machine diagrams for all 5 core business lifecycles defined in PRD §13.
- **Lifecycles:**
  1. *Cart Lifecycle:* `ACTIVE` -> `CHECKED_OUT` or `ABANDONED`.
  2. *Order Lifecycle:* `CREATED` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `OUT_FOR_DELIVERY` -> `DELIVERED`. Pre-shipment cancellation allowed from `CREATED`, `CONFIRMED`, and `PROCESSING`. Cancellation strictly blocked once `SHIPPED`.
  3. *Shipment Lifecycle:* `PENDING` -> `LABEL_CREATED` -> `IN_TRANSIT` (supports transition to `DELAYED` and resumption) -> `OUT_FOR_DELIVERY` -> `DELIVERED`.
  4. *Simulated Refund Lifecycle:* `SIMULATED_REFUND_REQUESTED` -> `SIMULATED_REFUND_APPROVED` -> `SIMULATED_REFUND_COMPLETED`.
  5. *Knowledge Document Lifecycle:* `DRAFT` -> `ACTIVE` -> `SUPERSEDED` -> `ARCHIVED`.

### 12. Security Trust Boundaries & RBAC Matrix
- **File:** [`12_security_rbac_trust_boundaries.svg`](12_security_rbac_trust_boundaries.svg)
- **Purpose:** Defines network boundaries, perimeter filters, tenant data isolation, and the role privilege hierarchy.
- **Security Zones:**
  - *Zone 1 (Perimeter):* CORS origin lock, rate limiting, standard JSON error responses.
  - *Zone 2 (Auth Gateway):* Argon2/BCrypt password hashing, stateless JWT authentication.
  - *Zone 3 (Tenant Guard):* Ownership verification (`orders.user_id == jwt.sub`) preventing IDOR vulnerabilities; PII masking.
  - *Zone 4 (RBAC Matrix):* Server-enforced roles: `CUSTOMER`, `SUPPORT_AGENT`, `OPS_MANAGER`, `CATALOG_MANAGER`, `KNOWLEDGE_ADMIN`, `ADMIN`.

### 13. AI Safety, Anti-Hallucination & Guardrails
- **File:** [`13_ai_safety_guardrails.svg`](13_ai_safety_guardrails.svg)
- **Purpose:** 5-tier guardrail defense system enforcing AI reliability and deterministic safety.
- **Guardrail Tiers:**
  - *Tier 1 (Input):* Prompt injection scanning, system prompt isolation, delimiter quarantine.
  - *Tier 2 (Grounding):* SQLite-only catalog query builder; RAG similarity threshold check (`score >= 0.22`, no outside knowledge).
  - *Tier 3 (Schema & Timeout):* Strictly typed JSON validation; 15s model timeout with bounded retries; deterministic fallback handlers.
  - *Tier 4 (Tools):* Scoped tool allowlists; idempotency keys on mutations; human-in-the-loop approval gates; anti-falsehood checks.
  - *Tier 5 (Output & Audit):* Product ID existence check before UI rendering; PII redaction; immutable audit trail logging.

### 14. Failure Modes & Recovery Playbooks
- **File:** [`14_failure_modes_and_recovery.svg`](14_failure_modes_and_recovery.svg)
- **Purpose:** Architecture and recovery workflows for 8 critical edge cases defined in PRD §14 & §15.
- **Covered Scenarios:**
  - *Double-click Checkout:* Idempotency key collision replays cached order; zero duplicate charge.
  - *Stock Race / Oversell:* Concurrency check fails; transaction aborts; returns `409 Conflict` + available alternatives.
  - *AI Model Timeout / Rate Limit:* Circuit breaker triggers fallback to keyword search and category facets.
  - *Malformed Model JSON:* Schema validation failure triggers fallback safely.
  - *Missing RAG Evidence:* Similarity below threshold returns safe fallback (`confidence: NONE`); zero hallucinated policies.
  - *Contradictory Policies:* Selects latest effective date; flags `confidence: LOW`; alerts Admin review queue.
  - *Cancel Shipped Order:* State machine invariant violation blocks cancellation with explicit shipping SLA reason.
  - *Unauthorized Tool Call:* RBAC filter failure blocks action; emits security alert to `audit_logs`.

### 15. Observability, AI Traces & Testing Strategy
- **File:** [`15_observability_audit_eval.svg`](15_observability_audit_eval.svg)
- **Purpose:** Comprehensive observability topography, audit trail, and evaluation testing framework.
- **Architectural Triad:**
  - *Distributed Tracing & Metrics:* End-to-end `traceId` propagation across HTTP, tools, and SQLite. In-process latency metrics.
  - *AI Traces & Audits:* Complete `assistant_messages.metadata` trace captures query, sanitized query, retrieved chunks, raw output, validated output, and latency. Immutable `audit_logs` table records state diffs.
  - *Testing Strategy & Golden Data:* Testing pyramid: Node.js native test runner (`node:test`) integration test suites (32 automated tests covering auth, catalog, cart, orders, RAG, agent tools, shopping assistant). Curated RAG Golden Dataset (policy Q&As, no-evidence cases). 5 Live Demo evaluation checklists.

---

## 5. Live Evaluation & Demo Scenario Alignment

The diagram suite directly supports the 5 live evaluation demo scenarios detailed in **PRD §21**:

1. **Demo 1: AI Product Discovery & Cart Add**  
   *Refer to:* [`07_shopping_assistant_pipeline.svg`](07_shopping_assistant_pipeline.svg) and [`04_customer_journey.svg`](04_customer_journey.svg).  
   *Validates:* Natural language constraint extraction, database grounding, weighted ranking, and factual explanation generation.

2. **Demo 2: Grounded Policy Answer via RAG**  
   *Refer to:* [`08_rag_knowledge_pipeline.svg`](08_rag_knowledge_pipeline.svg).  
   *Validates:* Active document version filtering, chunk similarity threshold check, citation packaging, and safe no-evidence fallback.

3. **Demo 3: Order Tracking & Safe Agent Support**  
   *Refer to:* [`09_agentic_operations.svg`](09_agentic_operations.svg), [`05_checkout_sequence.svg`](05_checkout_sequence.svg), and [`11_lifecycle_state_machines.svg`](11_lifecycle_state_machines.svg).  
   *Validates:* Shipment timeline inspection, pre-shipment cancellation, and post-dispatch cancellation blocking.

4. **Demo 4: Ops Console & Stock Override**  
   *Refer to:* [`12_security_rbac_trust_boundaries.svg`](12_security_rbac_trust_boundaries.svg) and [`10_entity_relationship_diagram.svg`](10_entity_relationship_diagram.svg).  
   *Validates:* Role-based admin access, manual inventory adjustment logging, and optimistic version incrementing.

5. **Demo 5: Failure Handling & Idempotency**  
   *Refer to:* [`14_failure_modes_and_recovery.svg`](14_failure_modes_and_recovery.svg) and [`13_ai_safety_guardrails.svg`](13_ai_safety_guardrails.svg).  
   *Validates:* Double-click checkout idempotency replay, model timeout fallback, and rejection of unauthorized agent mutations.

---
*ShopSmart AI Diagram Suite — Consolidated Vector Graphics.*
