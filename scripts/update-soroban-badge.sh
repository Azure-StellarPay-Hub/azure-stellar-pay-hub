#!/usr/bin/env bash
# update-soroban-badge.sh — Reads the Soroban SDK version from
# contracts/Cargo.toml and updates the corresponding shield.io badge in README.md.
#
# Usage:  bash scripts/update-soroban-badge.sh
# Exit 0:  README was already up to date (no changes).
# Exit 1:  Error (Cargo.toml missing, version not found, etc.).
# Exit 2:  README was updated.

set -euo pipefail

CARGO_TOML="${CARGO_TOML:-contracts/Cargo.toml}"
README="${README:-README.md}"

if [ ! -f "$CARGO_TOML" ]; then
  echo "ERROR: $CARGO_TOML not found" >&2
  exit 1
fi
if [ ! -f "$README" ]; then
  echo "ERROR: $README not found" >&2
  exit 1
fi

# Extract version from: soroban-sdk = "X.Y.Z"
VERSION=$(grep -oP 'soroban-sdk\s*=\s*"\K[^"]+' "$CARGO_TOML" | head -1)
if [ -z "$VERSION" ]; then
  echo "ERROR: Could not parse soroban-sdk version from $CARGO_TOML" >&2
  exit 1
fi

echo "Soroban SDK version: $VERSION"

# Check if the badge line already has the correct version.
if grep -qF "Soroban_SDK-${VERSION}-" "$README"; then
  echo "README badge already shows version $VERSION — nothing to update."
  exit 0
fi

# Build the new badge markdown line.
NEW_BADGE="[![Soroban SDK](https://img.shields.io/badge/Soroban_SDK-${VERSION}-7B3FE4?logo=stellar&logoColor=white)](https://soroban.stellar.org/docs)"

# Replace the line containing the Soroban SDK badge.
# Uses awk to match lines that start with [![Soroban SDK] and end with soroban.stellar.org/docs)
awk -v new="$NEW_BADGE" '
  /^\[!\[Soroban SDK\].*soroban\.stellar\.org\/docs\)$/ {
    if ($0 == new) { print; next }
    print new
    next
  }
  { print }
' "$README" > "$README.tmp" && mv "$README.tmp" "$README"

# Verify replacement was applied.
if ! grep -qF "Soroban_SDK-${VERSION}-" "$README"; then
  echo "ERROR: Failed to update badge in $README" >&2
  exit 1
fi

echo "README badge updated to Soroban SDK $VERSION"
exit 2
