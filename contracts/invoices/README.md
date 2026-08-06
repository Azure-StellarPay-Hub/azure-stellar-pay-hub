# Invoices Contract

On-chain invoice lifecycle: merchants issue invoices, customers settle them,
funds move directly to the merchant wallet, and the invoice is permanently
marked paid on-chain (immutable, auditable).

## Events

- `Issued { id, merchant, customer, amount }`
- `Paid { id, payer, merchant, amount }`
- `Cancelled { id, merchant }`

## Notes

- The backend persists a mirror of invoice state in PostgreSQL for dashboards
  and notifications; the contract is the settlement source of truth.
- `due = 0` disables the deadline; expired invoices cannot be paid (they can
  be re-issued).
- Only the intended customer can pay (`PayerMismatch` otherwise). For
  open-payment flows (payment links), the merchant contract handles the
  routing instead.
