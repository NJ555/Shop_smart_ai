# Refund Policy — v2026.1
Effective date: 2026-01-01. Region: GLOBAL.

## Refund Timeline
Simulated refunds are approved within 24 hours and complete within 5-7 business days.
No real money moves in this demo; refunds are marked SIMULATED_REFUND_COMPLETED.

## Eligibility
Refunds apply only to eligible cancelled or returned orders.
Refund amount can never exceed the paid order total.
Duplicate refund requests reuse the same idempotency key and return the original result.

## Approval
Simulated refunds above $100 require OPS_MANAGER or ADMIN approval in the Agent Ops console.
Refunds below $100 are auto-approved.

## Cancellation
Orders can be cancelled before shipment (CREATED, CONFIRMED, PROCESSING).
Orders cannot be cancelled after shipment (SHIPPED, OUT_FOR_DELIVERY, DELIVERED).
Cancelling an order triggers a simulated refund automatically.
