# Online Store

A microservices-based online store built as a learning and reference project. Demonstrates real-world patterns: async event-driven communication, RS256 JWT auth, GraphQL, structured logging, multi-database strategy, and AWS-ready infrastructure.

![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs)
![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm)
![Turborepo](https://img.shields.io/badge/Turborepo-2-EF4444?logo=turborepo)

---

## Overview

Five NestJS microservices communicating over REST, GraphQL, and RabbitMQ events, plus a **Next.js customer-facing storefront**. Deploys to AWS ECS Fargate via Terraform. Runs fully locally with Docker Compose — no AWS account required.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full architecture deep-dive.

---

## Services

| Service | Port | API | Database | Status |
|---|---|---|---|---|
| `web` | 3000 | Next.js App Router | — | ✅ Complete |
| `auth-service` | 3001 | REST + Swagger | PostgreSQL | ✅ Complete |
| `user-service` | 3002 | REST + Swagger | PostgreSQL | ✅ Complete |
| `product-service` | 3003 | GraphQL | PostgreSQL | ✅ Complete |
| `order-service` | 3004 | REST + Swagger | PostgreSQL | ✅ Complete |
| `notification-service` | 3005 | Internal (queue only) | MongoDB | ✅ Complete |

---

## Shared Packages

| Package | Purpose |
|---|---|
| `shared-types` | DTOs, queue event payload interfaces, common error types |
| `shared-middleware` | `JwtAuthGuard`, `RequestIdInterceptor`, `LoggingInterceptor`, `GlobalExceptionFilter` — imported as `SharedMiddlewareModule` |
| `shared-logger` | Pino-based `LoggerService` with `AsyncLocalStorage` request context — auto-includes `service`, `requestId`, `timestamp` on every log line |
| `queue-client` | `QueueClientModule` wrapping `@nestjs/microservices` — swap RabbitMQ/SQS via `QUEUE_TRANSPORT` env var |

---

## Web App (Customer Storefront)

The `web` app at `apps/web/` is a **Next.js 15 App Router** frontend that consumes all backend APIs through internal API route handlers (server-side proxy — no CORS, backend URLs hidden from the browser).

| Page | Route | Description |
|---|---|---|
| Login | `/login` | Email + password authentication |
| Register | `/register` | New account registration |
| Products | `/products` | Product grid with category filter + pagination |
| Product Detail | `/products/[id]` | Full product info, inventory, add to cart |
| Cart | `/cart` | Cart items, quantity controls, totals |
| Checkout | `/checkout` | Order placement (auth-guarded) |
| Orders | `/orders` | Order history table (auth-guarded) |
| Order Detail | `/orders/[id]` | Order line items + status badge |
| Profile | `/profile` | Edit name, avatar (auth-guarded) |

**Key architecture decisions:**

| Concern | Choice | Rationale |
|---|---|---|
| Styling | Tailwind CSS v4 + custom shadcn/ui-style primitives | Minimal bundle, consistent design tokens |
| State | Zustand + `persist` middleware (localStorage) | Lightweight, SSR-safe, no context boilerplate |
| Auth | Client-side tokens in zustand store | 401 interceptor auto-refreshes tokens and retries |
| GraphQL client | Plain `fetch` through API route proxy | Only 2-3 read queries — Apollo/urql unnecessary |
| API proxy | Next.js Route Handlers | Solves CORS, hides backend URLs, forwards auth headers |

---

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js 22, TypeScript 5.7 |
| Backend framework | NestJS 11 |
| Frontend framework | Next.js 15 (App Router) |
| UI | Tailwind CSS 4, custom shadcn/ui primitives, Lucide icons |
| Client state | Zustand 5 (persist middleware + localStorage) |
| REST API | `@nestjs/swagger` (OpenAPI auto-generated) |
| GraphQL | `@nestjs/graphql` + Apollo Server 5 (code-first) |
| PostgreSQL ORM | Prisma 7.5 + `@prisma/adapter-pg` |
| MongoDB ODM | Mongoose 8 |
| Authentication | RS256 JWT, `passport-jwt`, bcryptjs, JWKS endpoint |
| Message queue | RabbitMQ (local) / AWS SQS (production) via `@nestjs/microservices` |
| Caching | `@nestjs/cache-manager` — in-memory (local) / Redis 7 (production) |
| Logging | Pino 9 + pino-pretty |
| Validation | Zod (env vars), class-validator (request DTOs) |
| Monorepo | pnpm 10 workspaces + Turborepo 2 |
| Infrastructure | Terraform + AWS ECS Fargate, RDS, SQS, SES, ECR |

---

## Prerequisites

- **Node.js** ≥ 22 — [nvm](https://github.com/nvm-sh/nvm) recommended
- **pnpm** ≥ 10 — `npm install -g pnpm`
- **Docker + Docker Compose** — [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

| Container | Purpose | Port | UI |
|---|---|---|---|
| postgres | PostgreSQL 16 | 5432 | — |
| mongodb | MongoDB 7 | 27017 | — |
| rabbitmq | RabbitMQ 3 + management | 5672 / 15672 | http://localhost:15672 (guest/guest) |
| redis | Redis 7 | 6379 | — |
| localstack | AWS SQS + SES emulation | 4566 | — |
| mailhog | Email capture (SMTP + web UI) | 1025 / 8025 | http://localhost:8025 |

### 3. Configure environment files

Each service reads `.env.local` at startup. Copy the example file for each service you want to run:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/auth-service/.env.example apps/auth-service/.env.local
cp apps/user-service/.env.example apps/user-service/.env.local
cp apps/product-service/.env.example apps/product-service/.env.local
cp apps/order-service/.env.example apps/order-service/.env.local
cp apps/notification-service/.env.example apps/notification-service/.env.local
```

**Key variables — web** (`apps/web/.env.local`):

| Variable | Example | Notes |
|---|---|---|
| `AUTH_SERVICE_URL` | `http://localhost:3001` | Auth service base URL |
| `USER_SERVICE_URL` | `http://localhost:3002` | User service base URL |
| `PRODUCT_SERVICE_URL` | `http://localhost:3003` | Product service base URL (GraphQL) |
| `ORDER_SERVICE_URL` | `http://localhost:3004` | Order service base URL |

> These are server-side only (used in Next.js Route Handlers). They are never exposed to the browser.

**Key variables — auth-service** (`apps/auth-service/.env.local`):

| Variable | Example | Notes |
|---|---|---|
| `PORT` | `3001` | HTTP port |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/online_store?schema=auth` | Prisma reads `?schema=` |
| `JWT_PRIVATE_KEY` | `LS0t...` | Base64-encoded RS256 private key PEM |
| `JWT_PUBLIC_KEY` | `LS0t...` | Base64-encoded RS256 public key PEM |
| `JWT_ACCESS_EXPIRY` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token lifetime |
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | RabbitMQ connection |

**Key variables — user-service** (`apps/user-service/.env.local`):

| Variable | Example | Notes |
|---|---|---|
| `PORT` | `3002` | HTTP port |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/online_store?schema=users` | Separate `users` schema |
| `JWT_PUBLIC_KEY` | `LS0t...` | Same public key as auth-service |
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | Must match auth-service |

**Key variables — product-service** (`apps/product-service/.env.local`):

| Variable | Example | Notes |
|---|---|---|
| `PORT` | `3003` | HTTP port |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/online_store?schema=products` | Separate `products` schema |
| `JWT_PUBLIC_KEY` | `LS0t...` | Same public key as auth-service |

**Key variables — order-service** (`apps/order-service/.env.local`):

| Variable | Example | Notes |
|---|---|---|
| `PORT` | `3004` | HTTP port |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/online_store?schema=orders` | Separate `orders` schema |
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | Publishes order events |

**Key variables — notification-service** (`apps/notification-service/.env.local`):

| Variable | Example | Notes |
|---|---|---|
| `PORT` | `3005` | HTTP port |
| `MONGODB_URI` | `mongodb://localhost:27017/notifications` | Notification log storage |
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | Consumes events |
| `MAIL_HOST` | `localhost` | MailHog locally, SES on AWS |
| `MAIL_PORT` | `1025` | MailHog SMTP port |
| `MAIL_FROM` | `no-reply@online-store.local` | Sender address |
| `JWT_PUBLIC_KEY` | `LS0t...` | Same public key as auth-service |

> **JWT keys:** Generate a new RS256 key pair, or copy the values from an existing `.env.local` if you have one.

### 4. Run database migrations

```bash
# auth-service
cd apps/auth-service
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/online_store?schema=auth" \
  npx prisma migrate dev
cd ../..

# user-service
cd apps/user-service
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/online_store?schema=users" \
  npx prisma migrate dev
cd ../..

# product-service
cd apps/product-service
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/online_store?schema=products" \
  npx prisma migrate dev
cd ../..

# order-service
cd apps/order-service
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/online_store?schema=orders" \
  npx prisma migrate dev
cd ../..
```

### 5. Build shared packages

```bash
pnpm build
```

### 6. Run services

```bash
# All services in watch mode
pnpm dev

# Single service
pnpm dev --filter=@online-store/web
pnpm dev --filter=@online-store/auth-service
pnpm dev --filter=@online-store/user-service
pnpm dev --filter=@online-store/product-service
pnpm dev --filter=@online-store/order-service
pnpm dev --filter=@online-store/notification-service
```

---

## API Reference

### Auth Service — http://localhost:3001

Swagger UI: **http://localhost:3001/api**

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/auth/register` | — | Register new user, returns `accessToken` + `refreshToken` |
| `POST` | `/v1/auth/login` | — | Login, returns token pair |
| `POST` | `/v1/auth/refresh` | — | Exchange refresh token for new access token |
| `POST` | `/v1/auth/logout` | — | Revoke refresh token |
| `GET` | `/.well-known/jwks.json` | — | RS256 public key (JWKS format) |
| `GET` | `/health` | — | Health check |

### User Service — http://localhost:3002

Swagger UI: **http://localhost:3002/api**

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/users/me` | Bearer JWT | Get current user profile |
| `PATCH` | `/v1/users/me` | Bearer JWT | Update `firstName`, `lastName`, `avatarUrl` |
| `GET` | `/health` | — | Health check |

### Product Service — http://localhost:3003

GraphQL Playground (Apollo Sandbox): **http://localhost:3003/graphql**

| Operation | Name | Auth | Description |
|---|---|---|---|
| Query | `categories` | — | List all categories |
| Query | `category(id)` | — | Get category by ID |
| Query | `products(limit, offset, categoryId?)` | — | List products with pagination and optional category filter |
| Query | `product(id)` | — | Get product by ID |
| Mutation | `createCategory(input)` | Bearer JWT | Create a new category |
| Mutation | `deleteCategory(id)` | Bearer JWT | Delete a category |
| Mutation | `createProduct(input)` | Bearer JWT | Create product (auto-creates inventory at 0) |
| Mutation | `updateProduct(id, input)` | Bearer JWT | Update product fields |
| Mutation | `deleteProduct(id)` | Bearer JWT | Delete a product |

`category` and `inventory` on `ProductType` are resolved via **DataLoader** — N+1 safe regardless of page size.

### Order Service — http://localhost:3004

Swagger UI: **http://localhost:3004/api**

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/orders` | Bearer JWT | Create a new order |
| `GET` | `/v1/orders/me` | Bearer JWT | Get current user's orders |
| `GET` | `/v1/orders/:id` | Bearer JWT | Get order by ID |
| `PATCH` | `/v1/orders/:id/status` | Bearer JWT | Update order status |
| `GET` | `/health` | — | Health check |

### Notification Service — http://localhost:3005

No public API — consumes queue events only.

| `GET` | `/health` | — | Health check |

### Quick smoke test

```bash
# 1. Register and capture token
RESPONSE=$(curl -s -X POST http://localhost:3001/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"P@ssword123"}')
ACCESS_TOKEN=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

# 2. Get profile (auto-created via user.registered event)
curl -s http://localhost:3002/v1/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | python3 -m json.tool

# 3. Update profile
curl -s -X PATCH http://localhost:3002/v1/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Alice","lastName":"Smith"}' | python3 -m json.tool

# 4. Create a category (product-service)
CATEGORY=$(curl -s -X POST http://localhost:3003/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { createCategory(input: { name: \"Electronics\" }) { id name } }"}')
CAT_ID=$(echo $CATEGORY | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['createCategory']['id'])")

# 5. Create a product (inventory auto-initialized at qty=0)
curl -s -X POST http://localhost:3003/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"query\":\"mutation { createProduct(input: { name: \\\"Laptop\\\", price: 999.99, sku: \\\"LAP-001\\\", categoryId: \\\"$CAT_ID\\\" }) { id name price sku } }\"}" \
  | python3 -m json.tool

# 6. Query products (DataLoader resolves category + inventory in batch)
curl -s -X POST http://localhost:3003/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products { id name price sku category { name } inventory { quantity } } }"}' \
  | python3 -m json.tool
```

---

## Common Commands

```bash
pnpm install                              # install all dependencies
pnpm build                               # build all packages and apps
pnpm build --filter=@online-store/<pkg>  # build single package/app
pnpm dev                                 # run all services in watch mode
pnpm dev --filter=@online-store/<pkg>    # run single service
pnpm lint                                # lint everything
pnpm test                                # run all tests
pnpm test --filter=@online-store/<pkg>   # test single service
pnpm typecheck                           # type-check everything
docker compose up -d                     # start infra containers
docker compose down                      # stop infra containers
```

---

## Async Event System

Services communicate asynchronously via queue events. Publishers call `client.emit(pattern, payload)`. Consumers use `@EventPattern(pattern)`.

| Event | Publisher | Consumer(s) |
|---|---|---|
| `user.registered` | auth-service | user-service (create profile), notification-service (welcome email) |
| `order.placed` | order-service | notification-service (order confirmation) |
| `order.status.updated` | order-service | notification-service (status update) |

**Transport:** `QUEUE_TRANSPORT=rabbitmq` locally, `QUEUE_TRANSPORT=sqs` on AWS. Zero code changes — only the env var differs.

---

## Project Structure

```
online-store/
├── apps/
│   ├── web/                    # Next.js 15 customer storefront (Tailwind + zustand)
│   ├── auth-service/           # JWT issuer, register/login/logout/refresh
│   ├── user-service/           # User profile CRUD, user.registered consumer
│   ├── product-service/        # GraphQL product/category/inventory, DataLoader N+1 prevention
│   ├── order-service/          # Order lifecycle, publishes order.placed + order.status.updated events
│   └── notification-service/   # Email dispatch via MailHog/SES, consumes all queue events
├── packages/
│   ├── shared-types/           # DTOs and event payload interfaces
│   ├── shared-middleware/      # JwtAuthGuard, interceptors, exception filter
│   ├── shared-logger/          # Pino LoggerService with AsyncLocalStorage
│   └── queue-client/           # RabbitMQ / SQS abstraction
├── infrastructure/
│   └── terraform/
│       ├── modules/            # vpc, ecs, rds, sqs, ecr, alb
│       └── environments/       # dev/, prod/
├── docker-compose.yml          # Full local dev stack
├── turbo.json                  # Turborepo build pipeline
├── pnpm-workspace.yaml
├── ARCHITECTURE.md             # Full architecture reference
└── README.md
```

Each service follows the same layered structure:

```
src/
├── <domain>/
│   ├── <domain>.module.ts
│   ├── <domain>.controller.ts   # HTTP layer only — no business logic (REST services)
│   ├── <domain>.resolver.ts     # GraphQL resolver (product-service only)
│   ├── <domain>.service.ts      # Business logic
│   ├── <domain>.repository.ts   # DB access
│   ├── dto/                     # Input types, args, response types
│   └── types/                   # GraphQL ObjectTypes (product-service only)
├── prisma/
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── config/
│   └── index.ts                 # Zod schema — validates all env vars on startup
├── app.module.ts
└── main.ts
```

The **web** app follows Next.js App Router conventions:

```
apps/web/src/
├── app/
│   ├── (auth)/login/, register/   # Auth pages
│   ├── products/, [id]/           # Product catalog
│   ├── cart/                      # Shopping cart
│   ├── checkout/                  # Order placement
│   ├── orders/, [id]/             # Order history
│   ├── profile/                   # User profile
│   ├── api/                       # Route handlers (proxy to backend services)
│   │   ├── auth/login,register,refresh,logout/
│   │   ├── users/me/
│   │   ├── graphql/
│   │   └── orders/, [id]/
│   ├── layout.tsx                 # Root layout (Nav + ToastProvider)
│   └── page.tsx                   # Redirects to /products
├── components/
│   ├── ui/                        # Primitives (button, card, input, badge, table, etc.)
│   ├── nav.tsx                    # Top navigation with auth + cart state
│   ├── auth-guard.tsx             # Redirect-to-login wrapper
│   ├── product-card.tsx           # Product grid card
│   ├── cart-item.tsx              # Cart row with quantity controls
│   └── order-status-badge.tsx     # Color-coded order status
└── lib/
    ├── api-client.ts              # Typed fetch with 401 interceptor + token refresh
    ├── auth-store.ts              # Zustand auth state (tokens + user profile)
    ├── cart-store.ts              # Zustand cart state (items + computed totals)
    ├── graphql-queries.ts         # Product/category GraphQL query strings
    ├── types.ts                   # Client-side TypeScript types
    └── cn.ts                      # Tailwind class merge utility
```

**product-service** also contains `src/product/data-loaders.service.ts` — a REQUEST-scoped service that provides `DataLoader` instances for batching `category` and `inventory` lookups, preventing N+1 queries on nested GraphQL fields.

---

## Infrastructure (AWS)

| Concern | Local | AWS |
|---|---|---|
| Frontend | `next dev` on port 3000 | ECS Fargate (ALB default route) |
| Queue | RabbitMQ (`QUEUE_TRANSPORT=rabbitmq`) | Amazon SQS (`QUEUE_TRANSPORT=sqs`) |
| Email | MailHog (catch-all at :8025) | Amazon SES |
| Cache | In-memory (`CACHE_STORE=memory`) | ElastiCache Redis (`CACHE_STORE=redis`) |
| PostgreSQL | Docker container | Amazon RDS |
| MongoDB | Docker container | MongoDB Atlas or DocumentDB |
| AWS SDK | LocalStack (port 4566) | Real AWS endpoints |
| Secrets | `.env.local` files | AWS Secrets Manager |
| Containers | Local Docker daemon | Amazon ECR + ECS Fargate |

**ALB routing (production):**

```
Browser → ALB
  ├─ /v1/auth/*, /.well-known/*  → auth-service:3001    (priority 100)
  ├─ /v1/users/*                 → user-service:3002     (priority 200)
  ├─ /v1/products/*, /graphql    → product-service:3003  (priority 300)
  ├─ /v1/orders/*                → order-service:3004    (priority 400)
  └─ /* (default)                → web:3000              (catch-all)
```

The web app's Next.js Route Handlers proxy API calls to backend services internally via the ALB DNS — no CORS needed, backend URLs stay private.

**Provision with Terraform:**

```bash
cd infrastructure/terraform/environments/dev
terraform init
terraform plan
terraform apply
```

---

## Development Notes

**Prisma 7 + adapter-pg schema routing**
The `?schema=auth` query parameter in `DATABASE_URL` is a Prisma convention and is not understood by `pg`. Pass the schema as the second argument to `PrismaPg`:
```typescript
const adapter = new PrismaPg({ connectionString: cleanUrl }, { schema });
```
This makes Prisma fully qualify table names as `"auth"."users"` instead of defaulting to `"public"."users"`. All Postgres services in this project use this pattern.

**dotenv must load before any imports**
`src/config/index.ts` runs `configSchema.parse(process.env)` at import time (Zod fail-fast). `dotenv.config()` must be called at the very top of `main.ts` before any other imports:
```typescript
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
// all other imports below
```

**JWT public key**
Auth-service signs tokens with a private key. All other services verify tokens using the same RS256 public key. Set the same `JWT_PUBLIC_KEY` (base64-encoded PEM) in every non-auth service's `.env.local`.

**API versioning**
All REST endpoints use URI versioning: `/v1/...`. The health check (`GET /health`) uses `VERSION_NEUTRAL` and is never versioned. To add a new version, create a new controller with `version: '2'` alongside the existing one — never modify the v1 controller.

**shared-middleware in GraphQL services**
`GlobalExceptionFilter`, `RequestIdInterceptor`, and `LoggingInterceptor` all guard against non-HTTP execution contexts with `context.getType<string>() !== 'http'`. This lets them be applied globally via `app.useGlobalFilters/Interceptors()` in both REST and GraphQL services without crashing on GraphQL resolver invocations.

`JwtAuthGuard` overrides `getRequest()` to extract the Express `req` object from the Apollo context when `context.getType() === 'graphql'`. The GraphQL module must expose the request via `context: ({ req }) => ({ req })` in `GraphQLModule.forRoot()`.
