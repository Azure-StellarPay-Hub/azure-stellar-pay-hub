# Rewards / Loyalty Contract

On-chain loyalty and rewards system for the Stellar Pay platform.

## Features

- **Reward tiers** — admin defines Bronze, Silver, Gold, Platinum tiers with points thresholds.
- **Earn points** — merchants or the platform award points to customers for purchases.
- **Redeem rewards** — customers burn points in exchange for token rewards at configured rates.
- **Tier benefits** — each tier can have a multiplier and/or a flat discount rate.
- **Points expiry** — optional per-tier expiry (seconds since issuance).

## Events

- `TierCreated` / `TierUpdated`
- `PointsEarned`
- `PointsRedeemed`
- `TierUpgraded`

## Upgrade strategy

Deploy new version, migrate the tier/reward config via admin calls.

## Security

- Admin-only tier/reward configuration.
- `require_auth` on earn/redeem (earn: authorized earner; redeem: customer).
- Points balances are `i128`; overflow-safe arithmetic.
