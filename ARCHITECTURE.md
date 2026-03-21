# Online Store — Architecture & Project Plan

## Overview

A microservices-based online store built as a learning and implementation project.
Goals: best practices, scalability, clean architecture, real-world deployment patterns.

**Primary tech:** Node.js + TypeScript
**Framework:** NestJS
**Deployment target:** AWS ECS (Fargate)
**Infrastructure:** Terraform
**Repo structure:** Monorepo (pnpm workspaces + Turborepo)

---

## Services

| Service | Responsibility | DB | ORM/ODM | API Style |
|---|---|---|---|---|
| `auth-service` | Register, login, logout, JWT issuance & refresh | PostgreSQL | Prisma | REST |
| `user-service` | User profile CRUD | PostgreSQL | Prisma | REST |
| `product-service` | Product & category CRUD, inventory | PostgreSQL | Prisma | **GraphQL** |
| `order-service` | Order lifecycle, triggers payment/notification | PostgreSQL | Prisma | REST |
| `notification-service` | Email dispatch (welcome, order confirmed, etc.) | MongoDB | Mongoose | Internal only |

---

## Monorepo Structure

```
online-store/
├── apps/
│   ├── auth-service/
│   ├── user-service/
│   ├── product-service/
│   ├── order-service/
│   └── notification-service/
├── packages/
│   ├── shared-types/          # Shared TS interfaces, DTOs, event payloads
│   ├── shared-middleware/     # JWT auth middleware, error handlers, request logger
│   ├── shared-logger/         # Structured logging (pino) with correlation IDs
│   └── queue-client/          # Abstraction over RabbitMQ (local) / SQS (AWS)
├── infrastructure/
│   └── terraform/
│       ├── modules/
│       │   ├── ecs/
│       │   ├── rds/
│       │   ├── sqs/
│       │   ├── ecr/
│       │   └── vpc/
│       ├── environments/
│       │   ├── dev/
│       │   └── prod/
│       └── main.tf
├── docker-compose.yml         # Full local dev environment
├── docker-compose.override.yml
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── ARCHITECTURE.md
```

---

## Framework

**NestJS** is used for all services.

| NestJS module | Purpose |
|---|---|
| `@nestjs/common` + `@nestjs/core` | Base framework, DI container, decorators |
| `@nestjs/platform-express` | HTTP adapter (Express under the hood) |
| `@nestjs/config` + `zod` | Env var loading and validation — fails fast on startup |
| `@nestjs/jwt` | JWT signing/verification in auth-service |
| `@nestjs/passport` + `passport-jwt` | JWT strategy + Guards for protecting routes |
| `@nestjs/microservices` | Async queue transport — RabbitMQ locally, SQS on AWS |
| `@nestjs/graphql` + `type-graphql` | Code-first GraphQL in product-service |
| `@nestjs/cache-manager` | Provider-agnostic caching (see Caching section) |
| `@nestjs/swagger` | Auto-generated OpenAPI docs for REST services |

---

## Individual Service Structure

Each service follows NestJS module structure with a layered architecture:

```
<service-name>/
├── src/
│   ├── <domain>/                  # Feature module (one per domain aggregate)
│   │   ├── <domain>.module.ts     # NestJS module — wires providers together
│   │   ├── <domain>.controller.ts # HTTP/GraphQL layer — decorators only, no logic
│   │   ├── <domain>.service.ts    # Business logic — injected into controller
│   │   ├── <domain>.repository.ts # DB access — injected into service
│   │   ├── dto/                   # Request/response DTOs with class-validator
│   │   ├── resolvers/             # (GraphQL only) query and mutation resolvers
│   │   ├── events/
│   │   │   ├── <domain>.publisher.ts   # Emit events via @nestjs/microservices
│   │   │   └── <domain>.consumer.ts    # @EventPattern / @MessagePattern handlers
│   │   └── guards/                # Route-level Guards (service-specific only)
│   ├── common/
│   │   └── guards/                # Shared Guards (e.g. JwtAuthGuard re-exported)
│   ├── app.module.ts              # Root module — imports all feature modules
│   └── main.ts                    # Bootstrap: NestFactory.create(), global pipes/filters
├── prisma/
│   └── schema.prisma              # (Prisma services only)
├── Dockerfile
├── .env.example
├── package.json
└── tsconfig.json
```

**Pattern:** `Controller → Service → Repository` (enforced via NestJS DI — no layer skipping)

---

## Database Strategy

### Technology choices

- **PostgreSQL** — auth, user, product, order services (transactional, relational data)
- **MongoDB** — notification service (flexible schema, event/log storage)

### Schema isolation strategy

**Now (dev / cost-saving):**
Single PostgreSQL instance with separate schemas per service:
- `auth` schema
- `users` schema
- `products` schema
- `orders` schema

**Later (production):**
Point each service's `DATABASE_URL` env var to its own RDS instance.
No code changes required — Prisma makes this a config-only change.

### ORM / ODM

- **Prisma** for all PostgreSQL services — type-safe, excellent TS support, easy migrations
- **Mongoose** for notification service — schema-flexible, battle-tested with MongoDB

---

## Authentication & Authorization

### Strategy: RS256 JWT (Asymmetric Keys)

```
Auth Service                  All Other Services
────────────                  ──────────────────
Holds private key             Holds public key only
      │                               │
      ▼                               ▼
Signs access tokens           Verifies tokens locally
Issues refresh tokens         No calls back to auth service
```

### Token types

| Token | Lifetime | Storage |
|---|---|---|
| Access token | 15 minutes | HTTP-only cookie or Authorization header |
| Refresh token | 7 days | HTTP-only cookie, stored in DB |

### JWKS endpoint

Auth service exposes `GET /.well-known/jwks.json`
Other services verify tokens locally using the RS256 public key — no calls back to auth-service at request time. Set `JWT_PUBLIC_KEY` (base64-encoded PEM) in every non-auth service's `.env.local`.

### Inter-service auth

- Services verify JWTs using the shared public key via `shared-middleware`
- No service-to-service secrets needed
- Key rotation: update public key in JWKS endpoint, services pick it up on restart

---

## Communication Patterns

### Synchronous (REST)

Used when the calling service needs an immediate response.

| Caller | Called | Reason |
|---|---|---|
| order-service | product-service | Check stock availability before placing order |
| API Gateway | Any service | External client requests |

### Asynchronous (Queue-based events)

Used when services need to react to events without tight coupling.

| Event | Publisher | Consumer |
|---|---|---|
| `user.registered` | auth-service | notification-service (welcome email) |
| `order.placed` | order-service | notification-service (order confirmation email) |
| `order.status.updated` | order-service | notification-service (status update email) |
| `user.registered` | auth-service | user-service (create profile record) |

### Queue transport

`@nestjs/microservices` handles async messaging natively. The transport is swapped via env var:
- `QUEUE_TRANSPORT=rabbitmq` → `RmqTransport` (local dev)
- `QUEUE_TRANSPORT=sqs` → `SqsTransport` (AWS)

Publishers use `ClientProxy.emit(pattern, payload)`. Consumers use `@EventPattern(pattern)` on methods in a `@Controller()`. The `queue-client` shared package wraps the NestJS client registration so each service imports a single `QueueClientModule` without repeating transport config.

Zero code changes between environments — only env vars differ.

---

## Product Service — GraphQL

Product service uses `@nestjs/graphql` (code-first) with Apollo Server 5 instead of REST.

**Why product service?**
- Complex filtering — category, price range, pagination
- Nested data — products with categories and inventory
- Good surface area to learn DataLoader (N+1 problem solving)

**NestJS GraphQL setup:**
- `GraphQLModule.forRoot<ApolloDriverConfig>({ driver: ApolloDriver, autoSchemaFile: true, context: ({ req }) => ({ req }) })`
- `context: ({ req }) => ({ req })` — required so `JwtAuthGuard` can read the Bearer token from the Apollo context
- Resolvers are NestJS providers decorated with `@Resolver()`
- `DataLoadersService` (REQUEST-scoped) provides `DataLoader` instances per request for batching

**Implemented features:**
- Queries: `products(limit, offset, categoryId?)`, `product(id)`, `categories`, `category(id)`
- Mutations: `createProduct`, `updateProduct`, `deleteProduct`, `createCategory`, `deleteCategory`
- `@ResolveField` on `ProductType.category` and `ProductType.inventory` — batch-loaded via DataLoader
- Auth guard on all write mutations — `@UseGuards(JwtAuthGuard)` reads JWT from `context.req`

**DataLoader pattern:**

`DataLoadersService` is REQUEST-scoped so each request gets its own DataLoader cache (preventing cross-request data leakage). It's injected directly into `ProductResolver` (also REQUEST-scoped). On the first access to `inventory` or `category` fields in a product list response, the loader collects all IDs and issues a single batched DB query instead of N separate queries.

---

## Local Development

Full local stack runs via `docker-compose.yml` — no AWS account required.

### Services in docker-compose

| Container | Purpose | Local Port |
|---|---|---|
| `postgres` | PostgreSQL 16 | 5432 |
| `mongodb` | MongoDB 7 | 27017 |
| `rabbitmq` | RabbitMQ + management UI | 5672 / 15672 |
| `redis` | Redis 7 (cache) | 6379 |
| `localstack` | Emulates SQS + SES | 4566 |
| `mailhog` | Catches all outgoing emails, web UI | 1025 (SMTP) / 8025 (UI) |

App services run locally via `pnpm dev` (NestJS hot reload with `--watch`) or optionally as containers.

### Environment config

```
.env.local     → LocalStack endpoints, RabbitMQ, MailHog SMTP, local DB URLs
.env.aws       → Real SQS/SES ARNs, RDS connection strings, Secrets Manager refs
```

### Local vs AWS mapping

| Concern | Local | AWS |
|---|---|---|
| Queue | RabbitMQ (`QUEUE_TRANSPORT=rabbitmq`) | Amazon SQS (`QUEUE_TRANSPORT=sqs`) |
| Email sending | MailHog (catch-all) | Amazon SES |
| Cache | In-memory (`CACHE_STORE=memory`) | Redis / ElastiCache (`CACHE_STORE=redis`) |
| PostgreSQL | Docker container | Amazon RDS |
| MongoDB | Docker container | MongoDB Atlas or DocumentDB |
| AWS SDK calls | LocalStack (port 4566) | Real AWS endpoints |
| Secrets | `.env` files | AWS Secrets Manager |
| Container registry | Local Docker daemon | Amazon ECR |

---

## AWS Infrastructure (Terraform)

### Architecture on AWS

```
Internet
    │
    ▼
API Gateway / ALB
    │
    ├── /auth/*        → auth-service (ECS)
    ├── /users/*       → user-service (ECS)
    ├── /products/*    → product-service (ECS)  [GraphQL at /products/graphql]
    └── /orders/*      → order-service (ECS)

notification-service (ECS) — no public endpoint, queue consumer only

Shared:
- RDS PostgreSQL (single instance, separate schemas → later separate instances)
- MongoDB Atlas or DocumentDB
- SQS queues (one per event type)
- SES (email sending)
- ECR (one repo per service)
- Secrets Manager (DB credentials, JWT keys)
- CloudWatch (logs and metrics)
```

### Terraform module structure

```
infrastructure/terraform/
├── modules/
│   ├── vpc/              # VPC, subnets, NAT gateway, security groups
│   ├── ecs/              # ECS cluster, task definitions, services, IAM roles
│   ├── rds/              # RDS PostgreSQL instance and parameter groups
│   ├── sqs/              # SQS queues and dead-letter queues
│   ├── ecr/              # ECR repositories per service
│   └── alb/              # Application Load Balancer and target groups
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   └── prod/
│       ├── main.tf
│       ├── variables.tf
│       └── terraform.tfvars
└── main.tf
```

---

## Shared Packages

### `shared-types`
- Request/response DTOs for each service
- Queue event payload interfaces (typed by event name)
- Common error types

### `shared-middleware`
- `JwtAuthGuard` — RS256 JWT verification via `passport-jwt`; overrides `getRequest()` to support both HTTP and GraphQL execution contexts
- `RequestIdInterceptor` — injects `x-request-id` correlation ID; no-ops on non-HTTP contexts
- `LoggingInterceptor` — logs method, URL, status, and duration for every HTTP request; no-ops on non-HTTP contexts
- `GlobalExceptionFilter` — standardized error response shape for HTTP; re-throws in GraphQL context so Apollo formats the error
- Exported as a NestJS `SharedMiddlewareModule` — import once per service

### `shared-logger`
- `pino`-based NestJS `LoggerService` — drop-in replacement for NestJS's built-in logger
- Uses `AsyncLocalStorage` to automatically include `requestId` in every log line without manual passing
- Standard fields on every line: `timestamp`, `level`, `service` (from `SERVICE_NAME`), `requestId`
- Pretty output locally (`LOG_LEVEL=debug`), JSON in production (`LOG_LEVEL=info`) for CloudWatch Insights

### `queue-client`
- Exports `QueueClientModule` — a NestJS dynamic module wrapping `@nestjs/microservices`
- Reads `QUEUE_TRANSPORT` env var and registers the correct transport (RabbitMQ or SQS)
- Services import this once; no direct `@nestjs/microservices` config in individual services

---

## Caching

Uses `@nestjs/cache-manager` — provider-agnostic, no code changes to swap backends.

**Config toggle via env var:**
```
CACHE_STORE=memory    # default — no extra infra needed locally
CACHE_STORE=redis     # production / when Redis container is running
REDIS_URL=redis://localhost:6379
```

`CacheModule.registerAsync()` in each service's root module reads `CACHE_STORE` and wires the correct store. Services and controllers only interact with the `CACHE_MANAGER` injection token — never with Redis directly.

**Two caching layers:**

| Layer | How | When to use |
|---|---|---|
| Repository | Inject `CACHE_MANAGER`, cache read results, invalidate on writes | Expensive DB reads (product listings, category trees) |
| HTTP response | Apply NestJS `CacheInterceptor` to controller or route | Read-heavy GET endpoints with low write frequency |

**Local dev:** `CACHE_STORE=memory` — Redis container not required.
**Production:** `CACHE_STORE=redis` pointing to ElastiCache or the Redis ECS sidecar.

---

## CI/CD (GitHub Actions)

Per-service pipeline on push to `main`:

1. Lint + type check
2. Run tests
3. Build Docker image
4. Push to ECR
5. Update ECS task definition
6. Trigger ECS rolling deployment

Monorepo-aware: only pipelines for changed services run (Turborepo remote cache).

---

## API Versioning

**Strategy: URI versioning** — routes are prefixed with the version number.

```
GET /v1/products
GET /v1/orders
GET /v2/products   ← future, added alongside v1
GET /health        ← VERSION_NEUTRAL, never versioned
```

**NestJS setup in `main.ts`:**
```typescript
app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })
```

**Controller decoration:**
```typescript
@Controller({ version: '1', path: 'products' })
export class ProductsController {}
```

**Introducing a new version:**
Add a new controller class with `version: '2'` alongside the existing one — do not modify or delete the v1 controller. Both coexist in the same module.

**Rules:**
- Health check (`GET /health`) always uses `@VERSION_NEUTRAL` — never versioned
- Default version is `'1'` — unversioned clients get v1 automatically
- Never remove an older version controller without a deprecation period
- GraphQL (product-service) is not versioned at the URL level — use schema evolution and `@deprecated` directives

---

## Logging

### Strategy

Structured JSON logging via `pino`, surfaced as a NestJS `LoggerService` in `shared-logger`. Every log line is machine-parseable in production (CloudWatch Insights queries) and human-readable locally (pino-pretty).

### Standard fields on every log line

| Field | Source | Example |
|---|---|---|
| `timestamp` | pino | `2026-03-13T10:00:00.000Z` |
| `level` | pino | `info` |
| `service` | `SERVICE_NAME` env var | `order-service` |
| `requestId` | AsyncLocalStorage | `550e8400-e29b-41d4-a716` |
| `message` | log call | `Order created` |
| additional context | log call | `{ orderId, userId }` |

### Request context propagation

`AsyncLocalStorage` is used to carry `requestId` (and optionally `userId`) through the entire async call chain — controller → service → repository — without passing it as a function argument. The `RequestIdInterceptor` in `shared-middleware` sets the store on every incoming request. The logger reads from it automatically.

### `LoggingInterceptor`

Lives in `shared-middleware`. Applied **globally** in `main.ts` — never per-controller.

Logs on every HTTP request/response:
```json
{ "level": "info", "message": "incoming request", "method": "POST", "url": "/v1/orders", "requestId": "...", "userId": "..." }
{ "level": "info", "message": "request completed", "method": "POST", "url": "/v1/orders", "statusCode": 201, "durationMs": 42 }
```

### Log levels

| Environment | Level | Set via |
|---|---|---|
| Local dev | `debug` | `LOG_LEVEL=debug` |
| Production | `info` | `LOG_LEVEL=info` |
| Test | `warn` | `LOG_LEVEL=warn` |

### What to log

| Layer | What | Example |
|---|---|---|
| Controller | Never — handled by `LoggingInterceptor` | — |
| Service | Key business operations (create, update, delete, not reads) | `Order ${id} created` |
| Repository | Cache hits/misses on expensive queries | `Cache hit: products:all` |
| Event consumer | Every event received (with key IDs) | `Handling order.placed { orderId }` |
| Event publisher | Every event emitted | `Emitted order.placed { orderId }` |

### What NOT to log

- Passwords, tokens, API keys, Authorization headers
- Full request/response bodies (log shape/keys only, not values)
- PII (emails, names, addresses) — log IDs instead

---

## Standards & Practices

- **12-factor app** — config via env vars, stateless processes, disposability
- **OpenAPI/Swagger** — auto-generated per REST service via `@nestjs/swagger` decorators
- **Structured logging** — pino + correlation IDs for cross-service request tracing
- **Health checks** — `GET /health` on every service for ECS health monitoring
- **Input validation** — `zod` for all incoming request bodies and env vars
- **Error handling** — standardized error response shape across all services
- **Semantic versioning** — shared packages versioned independently
- **Conventional commits** — for clean git history and changelog generation

---

## Build Order

| Phase | Task | Status |
|---|---|---|
| 1 | Monorepo scaffold — pnpm workspaces, turborepo, base tsconfig, docker-compose | ✅ Complete |
| 2 | Auth service — register, login, logout, RS256 JWT, JWKS endpoint | ✅ Complete |
| 3 | Shared packages — shared-types, shared-middleware, shared-logger, queue-client | ✅ Complete |
| 4 | User service — profile CRUD, consumes `user.registered` event | ✅ Complete |
| 5 | Product service — GraphQL CRUD, categories, DataLoader | ✅ Complete |
| 6 | Order service — order lifecycle, sync call to product, emits `order.placed` | 🚧 Planned |
| 7 | Notification service — queue consumer, SES email dispatch | 🚧 Planned |
| 8 | Terraform infrastructure — VPC, ECS, RDS, SQS, ECR, ALB | 🚧 Planned |
| 9 | CI/CD pipelines — GitHub Actions per service | 🚧 Planned |
| 10 | End-to-end testing and deployment to AWS | 🚧 Planned |
