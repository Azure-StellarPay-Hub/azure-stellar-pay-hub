# Escrow Contract

Time-locked escrow: `create` (initiator deposits), `release` (counterparty or
initiator withdraws after the release time), `refund` (initiator before the
release time, or after expiry).

## Events

- `Created { id, initiator, counterparty, amount }`
- `Released { id, to, amount }`
- `Refunded { id, to, amount }`

## Security considerations

- Timestamps come from the ledger (`env.ledger().timestamp()`); only rough time
  guarantees (≈ ledger period) apply.
- `require_auth` on initiator (create/refund) and counterparty (release).
- Funds live in the contract balance; the admin has no withdrawal path by
  design (no backdoor).

## Upgrade strategy

Registry-based address swap (see `contracts/README.md`). Existing escrows are
finalized before migration is initiated (all escrows released or refunded).
