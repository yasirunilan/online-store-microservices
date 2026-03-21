# ---- Builder stage ----
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-middleware/package.json ./packages/shared-middleware/
COPY packages/shared-logger/package.json ./packages/shared-logger/
COPY packages/queue-client/package.json ./packages/queue-client/
COPY apps/product-service/package.json ./apps/product-service/

RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY packages/ ./packages/
COPY apps/product-service/ ./apps/product-service/

RUN pnpm --filter @online-store/shared-types build
RUN pnpm --filter @online-store/shared-middleware build
RUN pnpm --filter @online-store/shared-logger build
RUN pnpm --filter @online-store/queue-client build
RUN pnpm --filter @online-store/product-service build

# ---- Production stage ----
FROM node:22-alpine AS production

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-middleware/package.json ./packages/shared-middleware/
COPY packages/shared-logger/package.json ./packages/shared-logger/
COPY packages/queue-client/package.json ./packages/queue-client/
COPY apps/product-service/package.json ./apps/product-service/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-middleware/dist ./packages/shared-middleware/dist
COPY --from=builder /app/packages/shared-logger/dist ./packages/shared-logger/dist
COPY --from=builder /app/packages/queue-client/dist ./packages/queue-client/dist
COPY --from=builder /app/apps/product-service/dist ./apps/product-service/dist

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /app/apps/product-service

EXPOSE 3003

CMD ["node", "dist/main"]
