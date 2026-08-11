#!/bin/sh
set -e

echo "Running Prisma db push..."
cd /app
npx prisma db push --schema=/app/prisma/schema.prisma --skip-generate --accept-data-loss 2>&1 || echo "⚠️  db push skipped (database may not be ready yet)"

echo "Starting API..."
exec node dist/main.js
