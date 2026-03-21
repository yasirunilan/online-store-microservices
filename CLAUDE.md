# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Custom skills

| Command | Description |
|---|---|
| `/commit` | Stage and commit changes with a conventional commit message scoped to the affected service/package |
| `/pr [base-branch]` | Create a GitHub pull request with conventional title, change summary, and test plan |
| `/new-service <name> [rest\|graphql] [postgres\|mongo]` | Scaffold a new microservice with the full project structure and conventions |
| `/add-event <event.name> <publisher-service> <consumer-service>` | Wire up a new async queue event — payload type, publisher, and consumer |
| `/debug-event <event.pattern> [publisher] [consumer]` | Parallel-inspect publisher, consumer, and shared-types to diagnose why an event isn't flowing |
| `/check-arch` | Scan all 5 services in parallel for architecture violations — layer leakage, env access, cross-service imports, missing versioning, hardcoded event strings |

## Project reference

Full architecture decisions, service breakdown, build order, and infrastructure plan are documented in [ARCHITECTURE.md](ARCHITECTURE.md). Read it before making structural decisions.

## Monorepo tooling

```bash
pnpm install                        # install all dependencies
pnpm build                          # build all packages and apps (turborepo)
pnpm dev                            # run all services in dev/watch mode
pnpm dev --filter=auth-service      # run a single service
pnpm lint                           # lint all packages
pnpm test                           # run all tests
pnpm test --filter=auth-service     # run tests for a single service
pnpm test -- --testPathPattern=auth # run a single test file
```

## Local dev environment

```bash
docker compose up -d                # start postgres, mongodb, rabbitmq, localstack, mailhog
docker compose down                 # stop all containers
```

| UI | URL |
|---|---|
| RabbitMQ management | http://localhost:15672 |
| MailHog (email preview) | http://localhost:8025 |
| LocalStack (AWS emulation) | http://localhost:4566 |
| Redis | localhost:6379 (no UI — use `redis-cli`) |

Each service reads from `.env.local` locally. Copy `.env.example` to `.env.local` to get started.

## Architecture

### Framework

All services use **NestJS**. Each service is structured as NestJS modules:

```
Controller → Service → Repository   (enforced via NestJS DI)
```

Each domain area has its own NestJS feature module (`<domain>.module.ts`) wiring the controller, service, and repository together. Controllers handle HTTP/GraphQL parsing only — no business logic.

### Shared packages

`packages/` contains four internal packages:

- `shared-types` — DTOs, queue event payload interfaces, common error types
- `shared-middleware` — NestJS `JwtAuthGuard`, `RequestIdInterceptor`, `LoggingInterceptor` (logs all HTTP request/response with method, url, statusCode, durationMs), global exception filter — exported as `SharedMiddlewareModule`
- `shared-logger` — pino-based NestJS `LoggerService` with `AsyncLocalStorage` context; automatically includes `service`, `requestId`, `timestamp` on every line without manual passing; pretty locally, JSON in production
- `queue-client` — exports `QueueClientModule` wrapping `@nestjs/microservices`; transport selected via `QUEUE_TRANSPORT` env var (`rabbitmq` locally, `sqs` on AWS)

Never import directly from a sibling service. Cross-service types go through `shared-types`.

### API versioning

URI versioning via `app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })`. All controllers use `@Controller({ version: '1', path: '<domain>' })`. The health check uses `VERSION_NEUTRAL`. To introduce a new version, add a new controller class with `version: '2'` — never modify the existing one.

GraphQL (product-service) is not URL-versioned — use schema evolution and `@deprecated` directives.

### Auth pattern

Auth service signs JWTs with an RS256 private key and exposes `GET /.well-known/jwks.json`. All other services apply `JwtAuthGuard` from `shared-middleware` — verifies the token locally using the public key, no calls back to auth-service at request time.

### Async events

Services communicate asynchronously via `@nestjs/microservices`. Publishers inject `ClientProxy` (via `QueueClientModule`) and call `client.emit(pattern, payload)`. Consumers use `@EventPattern(pattern)` on methods in a `@Controller()`. Event payload types are defined in `shared-types`.

### Caching

All services use `@nestjs/cache-manager` via `CacheModule.registerAsync()` in the root module. Cache store is selected via `CACHE_STORE` env var (`memory` locally, `redis` in production). Repositories inject `CACHE_MANAGER` — services and controllers never touch the cache directly. Never import Redis packages directly.

### Product service — GraphQL

`product-service` uses `@nestjs/graphql` with `ApolloDriver` (code-first, `autoSchemaFile: true`). Resolvers are NestJS providers decorated with `@Resolver()`. Use `@nestjs/dataloader` for batching in list resolvers.

### Database

PostgreSQL services use Prisma. Each service has its own `prisma/schema.prisma` with a dedicated DB schema. The `DATABASE_URL` env var is the only thing that changes between local (single instance) and production (separate RDS instances).

`notification-service` uses Mongoose with MongoDB.

### Environment config

All env vars are parsed and validated with `zod` in `src/config/index.ts` at import time. The app fails fast if required vars are missing — never access `process.env` directly outside that file.

## Infrastructure

Terraform lives in `infrastructure/terraform/`. Modules are in `modules/`, environment-specific configs in `environments/dev/` and `environments/prod/`.

```bash
cd infrastructure/terraform/environments/dev
terraform init
terraform plan
terraform apply
```
