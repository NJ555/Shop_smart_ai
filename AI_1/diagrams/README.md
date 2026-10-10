# ShopSmart AI — Complete System Design Diagram Suite

> **Production-Minded System Architecture, Workflows, Data Models, AI Pipelines, Security Boundaries, and Failure Recovery Playbooks**  
> **Document Reference:** [PRD.md](../../PRD.md) (v1.0.0) | **Scope:** Hackathon MVP (Modular Monolith with In-Process Outbox & Simulated Boundaries)

---

## 1. Executive Architecture Summary

**ShopSmart AI** is an autonomous e-commerce assistant platform designed with a **modular monolith** backend in **Java 21 + Spring Boot 3 + Spring AI**, a reactive storefront in **React 19 + Vite**, and a unified persistence engine in **PostgreSQL 15+ with PgVector**.

### Core Engineering Invariants
1. **Catalog & Grounding Invariant:** AI recommendations and policy answers are strictly grounded in genuine PostgreSQL catalog and PgVector chunk records. Zero invented products, prices, specifications, or policies.
2. **Atomic Inventory & Concurrency:** Concurrency control utilizes pessimistic database locking (`SELECT ... FOR UPDATE`) during checkout transactions to prevent stock overselling.
3. **Controlled Agent Boundaries:** Operational AI agents execute actions exclusively through strongly typed domain tools with strict schema validation, role-based allowlists, idempotency keys, and human-in-the-loop approval gates.
4. **Scope Isolation:** Real payment processing, carrier integrations, and physical warehouses remain out of hackathon scope and are modeled as clean simulated boundaries (`PAID_SIMULATED`, simulated tracking numbers `SIM-TRACK-xxx`).

---

## 2. Master Diagram Inventory & PRD Section Mapping

The diagram suite contains **15 high-value engineering diagrams** organized across 6 functional subdirectories. Every diagram is accompanied by its reproducible Python generator (`.py`), high-resolution presentation image (`.png` at 300 DPI), scalable vector graphic (`.svg`), and editable Mermaid source (`.mmd`).

| # | Subdirectory | Diagram Title | Formats Available | PRD Sections Covered | Scope Classification |
|---|---|---|---|---|---|
| **01** | `architecture/` | [System Overview (Modular Monolith)](#01-system-overview-modular-monolith) | `.png`, `.svg`, `.mmd`, `.py` | §4.1, §4.2, §4.3, §4.4, §10, §22 | **MVP** |
| **02** | `architecture/` | [Deployment & Local Infrastructure](#02-deployment--local-infrastructure) | `.png`, `.svg`, `.mmd`, `.py` | §4.4, §22.1 – §22.6 | **MVP** |
| **03** | `architecture/` | [MVP vs. Post-Hackathon Evolution](#03-mvp-vs-post-hackathon-evolution) | `.png`, `.svg`, `.mmd`, `.py` | §2.1 – §2.4, §4.2, §23 | **MVP vs FUTURE** |
| **04** | `workflows/` | [Customer End-to-End Journey](#04-customer-end-to-end-journey) | `.png`, `.svg`, `.mmd`, `.py` | §3.1 – §3.3, §5.1 – §5.9 | **MVP** |
| **05** | `workflows/` | [Atomic Checkout & Stock Reservation Sequence](#05-atomic-checkout--stock-reservation-sequence) | `.png`, `.svg`, `.mmd`, `.py` | §5.8, §5.9, §11.6, §14.1, §15.2 | **MVP** |
| **06** | `workflows/` | [Async Events & Transactional Outbox Pattern](#06-async-events--transactional-outbox-pattern) | `.png`, `.svg`, `.mmd`, `.py` | §4.5, §10.2, §12.1 – §12.3, §23.3 | **MVP (KAFKA-READY)** |
| **07** | `ai/` | [10-Stage AI Shopping Assistant Pipeline](#07-10-stage-ai-shopping-assistant-pipeline) | `.png`, `.svg`, `.mmd`, `.py` | §6.1 – §6.11, §14.6, App A | **MVP (GROUNDED)** |
| **08** | `ai/` | [RAG Knowledge Ingestion & Hybrid Retrieval](#08-rag-knowledge-ingestion--hybrid-retrieval) | `.png`, `.svg`, `.mmd`, `.py` | §7.1 – §7.16, §13.5, App B | **MVP (GROUNDED RAG)** |
| **09** | `ai/` | [Agentic Operations Architecture & Tools](#09-agentic-operations-architecture--tools) | `.png`, `.svg`, `.mmd`, `.py` | §8.1 – §8.15, §11.11, App C | **MVP (CONTROLLED)** |
| **10** | `data_models/` | [Complete Database ERD & Relational Schema](#10-complete-database-erd--relational-schema) | `.png`, `.svg`, `.mmd`, `.py` | §10.1, §10.2 | **MVP SCHEMA** |
| **11** | `data_models/` | [Unified Lifecycle State Machines Suite](#11-unified-lifecycle-state-machines-suite) | `.png`, `.svg`, `.mmd`, `.py` | §13.1 – §13.5, §14.4 – §14.5 | **MVP STATE MACHINES** |
| **12** | `security/` | [Security Trust Boundaries & RBAC Matrix](#12-security-trust-boundaries--rbac-matrix) | `.png`, `.svg`, `.mmd`, `.py` | §5.1, §8.9 – §8.10, §18.1 – §18.6 | **MVP (SECURITY)** |
| **13** | `security/` | [AI Safety, Anti-Hallucination & Guardrails](#13-ai-safety-anti-hallucination--guardrails) | `.png`, `.svg`, `.mmd`, `.py` | §6.10, §7.16, §8.14, §18.4, App B & C | **MVP (AI SAFETY)** |
| **14** | `operations/` | [Failure Modes & Recovery Playbooks](#14-failure-modes--recovery-playbooks) | `.png`, `.svg`, `.mmd`, `.py` | §14, §15.1 – §15.9 | **MVP (FAULT TOLERANT)** |
| **15** | `operations/` | [Observability, AI Traces & Testing Strategy](#15-observability-ai-traces--testing-strategy) | `.png`, `.svg`, `.mmd`, `.py` | §19.1 – §19.4, §20.1 – §20.4, §21 | **MVP (TESTED)** |

---

## 3. Detailed Architectural Descriptions

### Architecture Category (`architecture/`)

#### 01. System Overview (Modular Monolith)
- **Files:** `architecture/01_system_overview.{png, svg, mmd, py}`
- **Purpose:** Illustrates the high-level system topology, module decomposition, and communication interfaces.
- **Key Modules:**
  - *Frontend:* React 19 + Vite storefront, assistant chat drawer, support workspace, and admin console.
  - *Backend Modules:* `identity`, `catalog`, `search`, `wishlist`, `cart`, `order`, `shipment`, `support`, `admin`, `audit`, and `outbox`.
  - *Spring AI Subsystem:* Shopping Assistant Orchestrator, Knowledge RAG Engine, Agentic Tool Runtime.
  - *Persistence:* Single PostgreSQL 15+ instance housing relational tables and PgVector vector embeddings.
  - *Boundaries:* Explicit simulated logistics and payment adapters behind clean Java interfaces.

#### 02. Deployment & Local Infrastructure
- **Files:** `architecture/02_deployment_infrastructure.{png, svg, mmd, py}`
- **Purpose:** Specifies container port bindings, internal bridge networking (`shopsmart-network`), volume mounts, and seed scripts.
- **Components:**
  - `frontend`: Node 20-Alpine / Vite 6 dev server on host port `5173`.
  - `backend`: Eclipse Temurin JDK 21 Spring Boot app container on host port `8080`.
  - `db`: `pgvector/pgvector:pg15` container on host port `5432` with named volume `shopsmart_pgdata`.
  - `seed`: Automatic database initialization via `01_init_schema.sql` and `02_seed_data.sql`.
  - `AI_PROVIDER`: Configurable between deterministic mock mode (`mock`), local Ollama (`ollama`), or cloud OpenAI (`openai`).

#### 03. MVP vs. Post-Hackathon Evolution
- **Files:** `architecture/03_mvp_vs_evolution.{png, svg, mmd, py}`
- **Purpose:** Clarifies what is implemented for the hackathon MVP versus how the architecture evolves in production.
- **Contrast Matrix:**
  - *MVP:* Single Spring Boot monolith, in-process Spring events, transactional outbox table, single-region PostgreSQL, simulated payment/carrier events.
  - *Post-Hackathon:* Decomposed microservices on Kubernetes, distributed Apache Kafka event backbone, real Stripe/Adyen payment gateways with 3DS webhooks, real FedEx/UPS APIs, multi-region database replication.

---

### Workflows Category (`workflows/`)

#### 04. Customer End-to-End Journey
- **Files:** `workflows/04_customer_journey.{png, svg, mmd, py}`
- **Purpose:** Maps the customer experience across 7 unified lifecycle stages.
- **Stages:**
  1. *Authentication & Tiers:* User registration, login, JWT issuance, preference loading, and tier display (`BASIC`, `PRIME`, `PREMIUM`).
  2. *Catalog Discovery:* Category hierarchy browsing, keyword search, faceted filters (price, brand, rating, availability).
  3. *AI Shopping Consultation:* Natural-language query, constraint extraction, catalog-grounded suggestions with reasons.
  4. *Evaluation:* PDP galleries, 4-way side-by-side spec comparison, persistent wishlist.
  5. *Cart Assembly:* Stock cap validation, real-time price rechecks, line item management.
  6. *Atomic Checkout:* Server-recalculated totals, pessimistic inventory locks, simulated payment, unique order ID (`ORD-xxx`).
  7. *Tracking & Support:* Shipment timeline (`LABEL_CREATED` -> `IN_TRANSIT` -> `DELIVERED`), pre-shipment cancellation, and RAG policy help.

#### 05. Atomic Checkout & Stock Reservation Sequence
- **Files:** `workflows/05_checkout_sequence.{png, svg, mmd, py}`
- **Purpose:** Details the database transaction boundary, concurrency locks, and idempotency guarantees during checkout.
- **Sequence Highlights:**
  - *Idempotency Check:* Checks `idempotency_keys` table; replayed requests immediately return cached order response without double billing.
  - *Price Revalidation:* Server recalculates subtotals; rejects stale or manipulated client-side prices.
  - *Pessimistic Concurrency:* Executes `SELECT available_quantity FROM inventory_levels FOR UPDATE`. If stock is insufficient, triggers rollback and returns `409 Conflict`.
  - *Atomic Commit:* Simultaneously inserts `orders`, `order_items` snapshots, updates `carts` to `CHECKED_OUT`, and inserts an `order.created` record into `outbox_events`.

#### 06. Async Events & Transactional Outbox Pattern
- **Files:** `workflows/06_async_events_outbox.{png, svg, mmd, py}`
- **Purpose:** Demonstrates how internal asynchronous events are processed reliably without dual-write risks.
- **Flow:**
  - Domain operations insert both domain entity and `outbox_events` row (`status = 'PENDING'`) in a single commit.
  - Scheduled poller queries pending outbox records and publishes to Spring `ApplicationEventPublisher`.
  - Dispatches to decoupled listeners: `ShipmentSimulator` (`order.created`), `InventoryReconciliation` (`order.cancelled`), `KnowledgeReIndexer` (`knowledge.document_published`), and `AuditStreamHandler` (`agent.action_completed`).
  - Outbox status transitions to `SENT`. Swappable with Debezium CDC and Kafka producer in production.

---

### AI & Agentic Category (`ai/`)

#### 07. 10-Stage AI Shopping Assistant Pipeline
- **Files:** `ai/07_shopping_assistant_pipeline.{png, svg, mmd, py}`
- **Purpose:** Illustrates the end-to-end pipeline from natural language shopper query to grounded product cards.
- **10 Stages:**
  1. *User Query:* `POST /api/v1/assistant/shopping/query`
  2. *Input Sanitization & Prompt Guard:* Strips control tokens, isolates inputs in delimiter tags.
  3. *Intent Classification:* Differentiates shopping intent from policy queries or chit-chat.
  4. *Constraint Extraction:* Structured JSON extraction (category, budget, RAM, storage, CPU).
  5. *Constraint Validation:* Validates against active catalog taxonomy; triggers clarifying questions on ambiguity.
  6. *Catalog Query Builder:* Builds dynamic PostgreSQL query filtering real products with price <= budget.
  7. *Database Product Retrieval:* Fetches real records only. Zero LLM product invention.
  8. *Deterministic Weighted Ranking:* 100% hard match, 30% budget fit, 30% spec fit, 20% rating, 10% availability, 10% user preferences.
  9. *Factual Explanation Builder:* Formulates reasons using only database attributes; bans promotional superlatives.
  10. *Response Delivery & Trace:* Jackson schema validation, trace ID attachment, UI product cards returned.

#### 08. RAG Knowledge Ingestion & Hybrid Retrieval
- **Files:** `ai/08_rag_knowledge_pipeline.{png, svg, mmd, py}`
- **Purpose:** Architecture of the version-aware enterprise policy assistant.
- **Two Pipeline Streams:**
  - *Stream 1 (Ingestion):* Uploads PDF/MD/JSON -> Parses headings -> Chunks text (600-900 tokens, 80-120 overlap) -> Generates dense vector embeddings via Spring AI -> Stores in PgVector `knowledge_chunks` with HNSW index -> Admin activates document (`DRAFT` -> `ACTIVE`; marks old version `SUPERSEDED`).
  - *Stream 2 (Retrieval):* User/Support query -> Hybrid cosine similarity search + keyword matching -> Mandatory metadata filter (`status = 'ACTIVE'`, latest `effectiveDate`, `region`) -> Similarity threshold check (cosine >= 0.72; if below, returns safe fallback with `confidence: NONE`) -> Contradiction resolver (prefers latest date; flags `confidence: LOW`) -> Grounded answer with citation packaging (document name, section, version, chunk ID).

#### 09. Agentic Operations Architecture & Tools
- **Files:** `ai/09_agentic_operations.{png, svg, mmd, py}`
- **Purpose:** Details how operational AI agents execute simulated actions safely.
- **Key Modules:**
  - *Orchestrator Agent:* Goal decomposition, user role boundary verification, sub-agent dispatch.
  - *Domain Agents:* Order Support Agent, Shipment Tracking Agent, Inventory Agent, Knowledge Agent, Fulfillment Exception Agent, Escalation Agent.
  - *Tool Execution Layer:* Strict tool allowlists per role, JSON schema validation, timeout/retry enforcement (reads: 2s/2 retries, writes: 5s/1 retry).
  - *Human-in-the-Loop Approval Gate:* Actions classified as sensitive (simulated refunds > $100, manual inventory adjustments, policy publishing) enter `PENDING_APPROVAL` status and require Admin Console sign-off.
  - *Anti-Falsehood Guard:* Agent cannot claim purchase or cancellation success unless underlying domain service confirms execution.

---

### Data Models & State Machines Category (`data_models/`)

#### 10. Complete Database ERD & Relational Schema
- **Files:** `data_models/10_entity_relationship_diagram.{png, svg, mmd, py}`
- **Purpose:** Full relational schema across 17 database tables, primary/foreign keys, and data ownership.
- **Entity Clusters:**
  - *Identity:* `users`, `customer_preferences`
  - *Catalog & Inventory:* `categories`, `products`, `product_attributes`, `product_images`, `inventory_levels` (with `version` lock)
  - *Commerce:* `wishlists`, `wishlist_items`, `carts`, `cart_items`
  - *Orders & Logistics:* `orders`, `order_items` (with frozen price/attribute snapshots), `shipments`, `shipment_events`, `refunds`
  - *Support:* `support_tickets`, `support_messages`
  - *Knowledge Vector:* `knowledge_documents`, `knowledge_chunks` (with `VECTOR` column and HNSW index)
  - *AI & Operational State:* `assistant_conversations`, `assistant_messages`, `agent_runs`, `agent_tool_calls`, `audit_logs`, `idempotency_keys`, `outbox_events`

#### 11. Unified Lifecycle State Machines Suite
- **Files:** `data_models/11_lifecycle_state_machines.{png, svg, mmd, py}`
- **Purpose:** State machine diagrams for all 5 core business lifecycles defined in PRD §13.
- **Lifecycles:**
  1. *Cart Lifecycle:* `ACTIVE` -> `CHECKED_OUT` or `ABANDONED`.
  2. *Order Lifecycle:* `CREATED` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `OUT_FOR_DELIVERY` -> `DELIVERED`. Pre-shipment cancellation allowed from `CREATED`, `CONFIRMED`, and `PROCESSING`. Cancellation strictly blocked once `SHIPPED`.
  3. *Shipment Lifecycle:* `PENDING` -> `LABEL_CREATED` -> `IN_TRANSIT` (supports transition to `DELAYED` and resumption) -> `OUT_FOR_DELIVERY` -> `DELIVERED`.
  4. *Simulated Refund Lifecycle:* `SIMULATED_REFUND_REQUESTED` -> `SIMULATED_REFUND_APPROVED` -> `SIMULATED_REFUND_COMPLETED`.
  5. *Knowledge Document Lifecycle:* `DRAFT` -> `ACTIVE` -> `SUPERSEDED` -> `ARCHIVED`.

---

### Security & Safety Category (`security/`)

#### 12. Security Trust Boundaries & RBAC Matrix
- **Files:** `security/12_security_rbac_trust_boundaries.{png, svg, mmd, py}`
- **Purpose:** Defines network boundaries, perimeter filters, tenant data isolation, and the role privilege hierarchy.
- **Security Zones:**
  - *Zone 1 (Perimeter):* CORS origin lock, rate limiting (auth: 5/min, AI: 20/min, orders: 10/min), RFC 7807 problem responses.
  - *Zone 2 (Auth Gateway):* BCrypt hash validation, stateless JWT filter (15-30m token expiration).
  - *Zone 3 (Tenant Guard):* Ownership verification (`orders.user_id == jwt.sub`) preventing IDOR vulnerabilities; PII masking.
  - *Zone 4 (RBAC Matrix):* Server-enforced roles: `CUSTOMER`, `SUPPORT_AGENT`, `OPS_MANAGER`, `CATALOG_MANAGER`, `KNOWLEDGE_ADMIN`, `ADMIN`, `AGENT_RUNTIME`.

#### 13. AI Safety, Anti-Hallucination & Guardrails
- **Files:** `security/13_ai_safety_guardrails.{png, svg, mmd, py}`
- **Purpose:** 5-tier guardrail defense system enforcing AI reliability and deterministic safety.
- **Guardrail Tiers:**
  - *Tier 1 (Input):* Prompt injection scanning, system prompt isolation, delimiter quarantine.
  - *Tier 2 (Grounding):* PostgreSQL-only catalog query builder; RAG similarity threshold check (no outside knowledge).
  - *Tier 3 (Schema & Timeout):* Strictly typed JSON validation via Jackson/Pydantic; 10s model timeout; deterministic fallback handlers.
  - *Tier 4 (Tools):* Scoped tool allowlists; idempotency keys on mutations; human-in-the-loop approval gates; anti-falsehood checks.
  - *Tier 5 (Output & Audit):* Product ID existence check before UI rendering; PII redaction; immutable audit trail logging.

---

### Operations & Observability Category (`operations/`)

#### 14. Failure Modes & Recovery Playbooks
- **Files:** `operations/14_failure_modes_and_recovery.{png, svg, mmd, py}`
- **Purpose:** Architecture and recovery workflows for 8 critical edge cases defined in PRD §14 & §15.
- **Covered Scenarios:**
  - *Double-click Checkout:* Idempotency key collision replays cached order; zero duplicate charge.
  - *Stock Race / Oversell:* Pessimistic lock fails; transaction rolls back; returns `409 Conflict` + available alternatives.
  - *AI Model Timeout / Rate Limit:* Circuit breaker triggers fallback to keyword search and category facets.
  - *Malformed Model JSON:* Schema validation failure triggers 1 corrective retry, then falls back safely.
  - *Missing RAG Evidence:* Similarity below threshold returns safe fallback (`confidence: NONE`); zero hallucinated policies.
  - *Contradictory Policies:* Selects latest effective date; flags `confidence: LOW`; alerts Admin review queue.
  - *Cancel Shipped Order:* State machine invariant violation blocks cancellation with explicit shipping SLA reason.
  - *Unauthorized Tool Call:* RBAC filter failure blocks action; emits security alert to `audit_logs`.

#### 15. Observability, AI Traces & Testing Strategy
- **Files:** `operations/15_observability_audit_eval.{png, svg, mmd, py}`
- **Purpose:** Comprehensive observability topography, audit trail, and evaluation testing framework.
- **Architectural Triad:**
  - *Distributed Tracing & Metrics:* End-to-end `traceId` propagation across HTTP, Spring AI, tools, and PostgreSQL. Micrometer latency SLAs.
  - *AI Traces & Audits:* Complete `assistant_messages.metadata` trace captures query, sanitized query, retrieved chunks, raw output, validated output, and latency. Immutable `audit_logs` table records state diffs.
  - *Testing Strategy & Golden Data:* Testing pyramid (JUnit 5 unit tests, Testcontainers PostgreSQL integration tests, E2E customer flow tests). Curated RAG Golden Dataset (20 policy Q&As, 5 manual Q&As, 5 no-evidence cases, 3 contradictions). 5 Live Demo evaluation checklists.

---

## 4. Setup, Regeneration & Execution Guide

### Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 20+** (Optional, for external tooling)
- Required Python Libraries:
  ```bash
  pip install matplotlib pillow numpy
  ```

### Master Regeneration Command
To regenerate all 15 diagrams and produce all `.png`, `.svg`, and `.mmd` deliverables:
```bash
python generate_all.py
```

### Verification Only Command
To verify that all 45 deliverables (`.png`, `.svg`, `.mmd`) exist, are non-empty, and conform to valid syntax without re-rendering:
```bash
python generate_all.py --verify-only
```

### Selective Single-Diagram Regeneration
To regenerate a specific diagram by name or number:
```bash
python generate_all.py --filter 01_system_overview
python generate_all.py --filter 07_shopping_assistant
python generate_all.py --filter 10_entity_relationship
```

Individual generator scripts can also be executed directly:
```bash
python architecture/01_system_overview.py
python workflows/05_checkout_sequence.py
python ai/08_rag_knowledge_pipeline.py
python data_models/10_entity_relationship_diagram.py
python security/13_ai_safety_guardrails.py
python operations/14_failure_modes_and_recovery.py
```

---

## 5. Directory Structure

```text
AI_1/diagrams/
├── README.md                                    # This master documentation file
├── generate_all.py                              # Central automated runner and validator
│
├── common/                                      # Reusable rendering and design framework
│   ├── __init__.py
│   ├── style.py                                 # Enterprise color palette, typography & tokens
│   ├── renderer.py                              # Matplotlib canvas, nodes, arrows, and multi-format exporter
│   └── mermaid_utils.py                         # Mermaid syntax validator and formatting helpers
│
├── architecture/                                # Core architecture & infrastructure diagrams
│   ├── 01_system_overview.{py, png, svg, mmd}
│   ├── 02_deployment_infrastructure.{py, png, svg, mmd}
│   └── 03_mvp_vs_evolution.{py, png, svg, mmd}
│
├── workflows/                                   # Customer journeys & interaction sequences
│   ├── 04_customer_journey.{py, png, svg, mmd}
│   ├── 05_checkout_sequence.{py, png, svg, mmd}
│   └── 06_async_events_outbox.{py, png, svg, mmd}
│
├── ai/                                          # Shopping assistant, RAG & agentic operations
│   ├── 07_shopping_assistant_pipeline.{py, png, svg, mmd}
│   ├── 08_rag_knowledge_pipeline.{py, png, svg, mmd}
│   └── 09_agentic_operations.{py, png, svg, mmd}
│
├── data_models/                                 # Relational schema & state machines
│   ├── 10_entity_relationship_diagram.{py, png, svg, mmd}
│   └── 11_lifecycle_state_machines.{py, png, svg, mmd}
│
├── security/                                    # Trust boundaries, RBAC & AI guardrails
│   ├── 12_security_rbac_trust_boundaries.{py, png, svg, mmd}
│   └── 13_ai_safety_guardrails.{py, png, svg, mmd}
│
└── operations/                                  # Fault tolerance, observability & testing
    ├── 14_failure_modes_and_recovery.{py, png, svg, mmd}
    └── 15_observability_audit_eval.{py, png, svg, mmd}
```

---

## 6. Live Evaluation & Demo Scenario Alignment

The diagram suite directly supports the 5 live evaluation demo scenarios detailed in **PRD §21**:

1. **Demo 1: AI Product Discovery & Cart Add**  
   *Refer to:* [07_shopping_assistant_pipeline](ai/07_shopping_assistant_pipeline.png) and [04_customer_journey](workflows/04_customer_journey.png).  
   *Validates:* Natural language constraint extraction, database grounding, weighted ranking, and factual explanation generation.

2. **Demo 2: Grounded Policy Answer via RAG**  
   *Refer to:* [08_rag_knowledge_pipeline](ai/08_rag_knowledge_pipeline.png).  
   *Validates:* Active document version filtering, chunk similarity threshold check, citation packaging, and safe no-evidence fallback.

3. **Demo 3: Order Tracking & Safe Agent Support**  
   *Refer to:* [09_agentic_operations](ai/09_agentic_operations.png), [05_checkout_sequence](workflows/05_checkout_sequence.png), and [11_lifecycle_state_machines](data_models/11_lifecycle_state_machines.png).  
   *Validates:* Shipment timeline inspection, pre-shipment cancellation, and post-dispatch cancellation blocking.

4. **Demo 4: Ops Console & Stock Override**  
   *Refer to:* [12_security_rbac_trust_boundaries](security/12_security_rbac_trust_boundaries.png) and [10_entity_relationship_diagram](data_models/10_entity_relationship_diagram.png).  
   *Validates:* Role-based admin access, manual inventory adjustment logging, and optimistic version incrementing.

5. **Demo 5: Failure Handling & Idempotency**  
   *Refer to:* [14_failure_modes_and_recovery](operations/14_failure_modes_and_recovery.png) and [13_ai_safety_guardrails](security/13_ai_safety_guardrails.png).  
   *Validates:* Double-click checkout idempotency replay, model timeout fallback, and rejection of unauthorized agent mutations.

---
*Generated by the ShopSmart AI Diagram Automation Suite.*
