# syntax=docker/dockerfile:1
# --- Build stage -----------------------------------------------------------
FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json nx.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile --filter @stellar-pay/api... --filter @stellar-pay/database

FROM deps AS build
WORKDIR /app
# Generate the Prisma client, then compile packages + api in dependency order.
RUN pnpm --filter @stellar-pay/database build
RUN pnpm --filter @stellar-pay/api build
RUN pnpm --filter @stellar-pay/api --prod deploy /out/node_modules

# --- Runtime stage ----------------------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/dist /app/dist
COPY --from=build /app/packages/database/prisma /app/prisma
EXPOSE 4000
CMD ["node", "dist/main.js"]
