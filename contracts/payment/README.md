# Payment Contract

Core transfer primitive: single and batch payments of allowlisted tokens.

## Functions

| Function                              | Auth    | Description          |
| ------------------------------------- | ------- | -------------------- |
| `initialize(admin)`                   | –       | One-time init        |
| `send(from, to, token, amount, memo)` | `from`  | Single payment       |
| `send_batch(from, token, recipients)` | `from`  | Batch/split payments |
| `set_allowed(admin, token, allowed)`  | `admin` | Token allowlist      |
| `is_allowed(token)`                   | –       | Allowlist query      |
| `pause(admin)` / `unpause(admin)`     | `admin` | Emergency stop       |
| `balance(account, token)`             | –       | Read-only balance    |

## Events

- `Payment { from, to, token, amount, memo }`
- `BatchPayment { from, token, recipients, total }`
- `Paused { by }` / `Unpaused { by }`

## Security considerations

- `require_auth` on every sender; amount bounds enforced before transfer.
- Only allowlisted tokens can be moved - an operator review gate.
- Pause acts as a kill switch; consider a timelock before admin operations in
  production.
- Amounts are `i128` stroops; conversion from user-facing decimals happens
  off-chain (see `@stellar-pay/shared` money helpers).

## Upgrade strategy

Deploy a new version and update the registry address stored by the backend
(`Setting` → `contracts.payment`). Funds are never held by this contract, so
no migration of balances is required.
