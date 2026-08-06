# Merchant Contract

Merchant registry and settlement vault.

- `register` – owner creates a profile (name, settlement address, commission bps)
- `record_sale` – credits held balances (called by payment/settlement flows)
- `settle` – owner moves net held funds to the settlement address; the
  platform commission is withheld and sent to the treasury admin
- `set_commission` / `set_active` / `update_profile` – admin/owner controls

## Events

- `Registered { id, owner, name }`
- `SaleRecorded { id, token, amount }`
- `Settled { id, token, amount, commission, to }`
- `ProfileUpdated`, `Activated`

## Security considerations

- Only the owner can settle; commission goes directly to the platform admin
  address (treasury).
- Commission math uses integer basis points (no float).
- Held balances are per merchant per token; an inactive merchant cannot
  accrue new sales.

## Upgrade strategy

Merchant profiles are cheap to recreate; migrate profiles and held balances by
replaying `record_sale` from on-chain events before pointing the backend at
the new contract address.
