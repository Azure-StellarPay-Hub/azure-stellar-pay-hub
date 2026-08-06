# Subscriptions Contract

Recurring payment plans. Merchants create plans; subscribers join; an
off-chain keeper (the API scheduler, or any user) calls `renew` when a period
is due, moving tokens from subscriber → merchant.

## Events

- `PlanCreated { id, merchant, amount }`
- `Subscribed { id, subscriber, plan_id }`
- `Renewed { id, plan_id, amount, merchant }`
- `Cancelled { id, by }`

## Operational model

- Pull-based: `renew` requires the subscriber to hold the balance. On
  insufficient balance the subscription is paused (not failed) and an event
  allows the backend to notify the subscriber.
- The API `ScheduledPayment`/scheduler calls `renew` for all due
  subscriptions on a cron (see `apps/api` scheduler module).

## Security considerations

- `require_auth` on subscriber (subscribe/cancel) and merchant (create/cancel).
- Interval is defined at plan creation; subscribers should be shown the full
  schedule before consent.
- Cancel is unilateral from either party - design decisions around refunds
  (pro-rata) belong in the backend/merchant policy.
