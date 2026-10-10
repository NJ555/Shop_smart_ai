# ShopSmart AI — Mobile Client (`frontend-app/`)

> **Status:** Implemented React Native / Expo Client (SDK 52)  
> **Backend Integration:** Connects to `http://<host-ip>:4000/api/v1`

---

## 1. Overview
The mobile interface is implemented in `frontend-app/` using React Native and Expo SDK 52 in TypeScript. It shares the identical backend REST API, authentication tokens, catalog, and AI pipelines with the Next.js web application.

## 2. Implemented Screens (`src/screens/`)
- `HomeScreen.tsx`: Catalog browsing, category filtering, search, and assistant quick-prompts.
- `AssistantScreen.tsx`: AI shopping consultation, Policy RAG Q&A, and order tracking.
- `ProductDetailModal.tsx`: Product specs, price, stock availability, and cart actions.
- `CartCheckoutModal.tsx`: Sliding bottom-sheet cart and simulated checkout with idempotency.
- `OrdersScreen.tsx`: Order history, live shipment tracking events, and cancellation.
- `CompareWishlistScreen.tsx`: Side-by-side spec comparison and saved items.
- `OpsAdminScreen.tsx`: Mobile operations view for stock adjustments and refund approvals.

## 3. Running Locally
```cmd
cd frontend-app
npm install
npx expo start
```
Runs on port `8081` (tested and passing TypeScript type-checking).
