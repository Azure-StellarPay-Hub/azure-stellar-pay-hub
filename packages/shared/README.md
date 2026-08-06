# @stellar-pay/shared

Framework-agnostic utilities shared by the SDK, API and frontend apps:

- **Stellar validation** – public key (G/M addresses), asset codes, memos
- **Money math** – exact stroop ↔ unit conversion using `bigint`
- **Payment URIs** – build/parse `web+stellar:pay` URIs for QR codes & links
- **Pagination** – page/pageSize helpers used by the API
- **IDs & secrets** – `crypto`-based helpers (browser + Node compatible)

All functions are dependency-free except `@stellar-pay/types`, and are safe to
import from both Node.js and browser bundles.
