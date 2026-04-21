# SCRATCHPAD — tracer investigation

## Goal
Trace the refund flow from the customer support endpoint to Stripe.

## Files examined
- src/api/refund.ts        → entry point, validates body, calls `refundService.process`
- src/services/refund.ts   → orchestrates, emits `refund.requested` event, calls stripe client
- src/clients/stripe.ts    → thin wrapper around `stripe.refunds.create`

## Key functions
- `refundService.process(orderId, amount)`
  - validates ≤ $500 limit
  - emits `refund.requested`
  - awaits Stripe response
  - emits `refund.succeeded` or `refund.failed`

## Hypotheses
- [~] refund.failed events are not being consumed  — DISPROVED: consumer at src/events/refund.consumer.ts
- [ ] tax reversal happens on success; on failure, tax stays debited  — UNVERIFIED

## Next
Read src/events/refund.consumer.ts; verify the tax-reversal path on success.
