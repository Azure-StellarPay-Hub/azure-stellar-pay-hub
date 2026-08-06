# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Azure StellarPay Hub seriously. Please **do not** open a
public GitHub issue for security vulnerabilities.

Report vulnerabilities privately by opening a **private security advisory**
(GitHub → Security → Report a vulnerability) or by emailing
`security@stellar-pay.dev` with:

- A description of the vulnerability and its impact
- Steps to reproduce
- Affected components (app, package, contract, endpoint)

You should receive an acknowledgement within 72 hours and a detailed response
within one week.

## Scope

The following are in scope:

- Smart contracts under `contracts/` (Soroban/Rust)
- Backend API under `apps/api`
- Frontend applications under `apps/web`, `apps/admin`, `apps/explorer`
- Shared packages under `packages/`
- CI/CD configuration under `.github/`

## Out of scope

- Stellar Core / Horizon infrastructure operated by third parties
- Wallets (Freighter, xBull, Albedo) - report directly to their maintainers

## Disclosure

We will credit researchers who report valid vulnerabilities in the release notes
(unless anonymity is requested) and will not pursue legal action for good-faith
research conducted in accordance with this policy.
