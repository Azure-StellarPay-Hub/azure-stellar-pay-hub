#!/usr/bin/env bash
# First-time bootstrap: install deps, scaffold envs, generate Prisma client,
# push the schema and seed demo data.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Installing dependencies"
corepack enable 2>/dev/null || true
pnpm install

echo "==> Scaffolding environment files"
bash scripts/generate-env.sh

echo "==> Generating Prisma client"
pnpm db:generate

echo "==> Pushing schema + seeding demo data"
if [[ -z "${SKIP_DB:-}" ]]; then
  pnpm db:push
  pnpm db:seed
else
  echo "SKIP_DB set — skipping database push/seed."
fi

echo
echo "Setup complete. Start everything with: pnpm dev"
