#!/usr/bin/env bash
# Scaffold per-app .env files from .env.example templates (never overwrites existing).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

copy_if_missing() {
  local src="$1"
  local dst="$2"
  if [[ -f "$dst" ]]; then
    echo "exists  $dst (kept)"
  else
    cp "$src" "$dst"
    echo "created $dst"
  fi
}

copy_if_missing ".env.example" ".env"
copy_if_missing "apps/api/.env.example" "apps/api/.env"

echo
echo "Done. Fill in secrets (DATABASE_URL, JWT_SECRET, ...) before starting."
