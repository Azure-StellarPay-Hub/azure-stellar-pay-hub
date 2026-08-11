#!/bin/sh
set -e

echo "Validating environment..."
missing=""

check_required() {
  var_name="$1"
  min_len="$2"
  eval val="\$$var_name"
  if [ -z "$val" ]; then
    echo "  ❌ $var_name is not set"
    missing="$missing $var_name"
  elif [ "${#val}" -lt "$min_len" ]; then
    echo "  ❌ $var_name is too short (min $min_len chars, got ${#val})"
    missing="$missing $var_name"
  else
    echo "  ✅ $var_name"
  fi
}

warn_default() {
  var_name="$1"
  default_val="$2"
  eval val="\$$var_name"
  if [ -z "$val" ] || [ "$val" = "$default_val" ]; then
    echo "  ⚠️  $var_name is using the default ($default_val) — override in production"
  else
    echo "  ✅ $var_name"
  fi
}

echo "Required:"
check_required DATABASE_URL 1
check_required JWT_SECRET 16
check_required ADMIN_PASSWORD 8
check_required WEBHOOK_SIGNING_SECRET 16

echo "Recommended (non-default):"
warn_default REDIS_URL "redis://localhost:6379"

if [ -n "$missing" ]; then
  echo ""
  echo "❌ Cannot start: missing or invalid required variables:$missing"
  exit 1
fi

echo ""
echo "Running Prisma migrations..."
cd /app

# migrate deploy is production-safe: applies pending migrations, won't cause data loss.
# No --skip-generate needed — the Prisma client was already generated during build.
# Retry loop tolerates transient connection failures but fails hard on real errors.
for i in $(seq 1 5); do
  if npx prisma migrate deploy --schema=/app/prisma/schema.prisma 2>&1; then
    echo "✅ Migrations applied successfully"
    break
  fi
  if [ "$i" -eq 5 ]; then
    echo "❌ migrate deploy failed after 5 attempts"
    exit 1
  fi
  echo "⚠️  attempt $i/5 failed, retrying in 3s..."
  sleep 3
done

echo "Starting API..."
exec node dist/main.js
