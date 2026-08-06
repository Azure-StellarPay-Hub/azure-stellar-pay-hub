# Multisig Contract

Multi-signature proposal system for high-value operations (large transfers,
treasury spends, admin actions).

- `submit` creates a proposal with an opaque payload
- signers `approve` / `reject`
- `execute` runs once approvals reach the configured threshold
- signer set can evolve via `add_signer` / `remove_signer` (current quorum
  must be maintained)

## Execution extension point

`Proposal.data` is an opaque `Vec<u8>`. Production integrations should encode
a target contract + function + args and decode inside `execute` with
`env.invoke_contract(...)`. The backend (`apps/api`) documents the payload
schema it expects; the scaffold keeps execution as a state transition + event.

## Security considerations

- Only registered signers can act; `require_auth` on every mutation.
- Threshold must be ≥ 1 and ≤ signer count.
- Signer-set changes are themselves subject to the quorum convention (any
  signer can trigger, but the operation is auditable via events).
- Consider replay protection (proposal ids are monotonic).
