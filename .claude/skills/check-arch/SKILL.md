---
name: check-arch
description: Scan all services in parallel for architecture violations — layer leakage, direct env access, cross-service imports, missing versioning, and more. Use before committing or after a large refactor.
allowed-tools: Glob, Grep, Read
---

# Architecture Compliance Check

Scan all five services simultaneously for violations of the project's architecture rules. Each service is inspected by a parallel Explore agent.

## Services to scan

`auth-service`, `user-service`, `product-service`, `order-service`, `notification-service`

## Launch 5 parallel Explore agents — one per service

Each agent receives the same checklist but scans only its assigned service under `apps/<service-name>/src/`.

### Checklist for each agent

#### 1. Direct `process.env` access
Search for `process.env` anywhere outside `src/config/index.ts`.
> Rule: env vars must only be read in `src/config/index.ts` via zod schema.

#### 2. Cross-service imports
Search for imports from `@online-store/auth-service`, `@online-store/user-service`, `@online-store/product-service`, `@online-store/order-service`, or `@online-store/notification-service`.
> Rule: services never import from sibling services. Cross-service types go through `@online-store/shared-types`.

#### 3. Business logic in controllers
In `*.controller.ts` files, look for:
- Direct repository injection (`@InjectRepository`, `private readonly *Repo`, `private readonly *Repository` in a controller constructor)
- Database calls (`prisma.`, `this.prisma.`, `mongoose.`)
- Complex conditional logic beyond a single guard check
> Rule: controllers contain decorators and delegation only — no business logic.

#### 4. DB queries outside repositories
In `*.service.ts` files, look for:
- `prisma.` or `this.prisma.` calls
- `mongoose.` model calls
> Rule: all DB access goes through repository files only.

#### 5. Missing API versioning
In `*.controller.ts` files (excluding `*.consumer.ts`), check that `@Controller` decorators use `{ version: '...', path: '...' }` object form, not the plain string form `@Controller('path')`.
> Exception: health check controller uses `VERSION_NEUTRAL` — that is correct.

#### 6. Redis imported directly
Search for `import.*ioredis`, `import.*redis`, `require.*redis` anywhere other than `src/config/cache.config.ts`.
> Rule: cache access only via `CACHE_MANAGER` injection token.

#### 7. Hardcoded event pattern strings
In `*.publisher.ts` and `*.consumer.ts` files, look for `client.emit('...')` or `@EventPattern('...')` with a hardcoded string literal instead of a constant from `@online-store/shared-types`.
> Rule: event pattern strings are defined once in `shared-types` as constants.

#### 8. Missing `QueueClientModule` in consumer app.module
For services that have `*.consumer.ts` files, verify `QueueClientModule` is in the `imports` array of `app.module.ts`.

## Report format

After all agents return, produce a consolidated report:

```
## Architecture Check — <date>

### auth-service       ✅ clean / ⚠️ N violations
### user-service       ✅ clean / ⚠️ N violations
### product-service    ✅ clean / ⚠️ N violations
### order-service      ✅ clean / ⚠️ N violations
### notification-service ✅ clean / ⚠️ N violations

---

## Violations

### <service-name>
- [RULE] <file>:<line> — <description of violation>
- [RULE] <file>:<line> — <description of violation>

---

## Summary
Total violations: N
Services clean: N/5
```

If all services are clean, say so clearly — no need to pad the report.

## Rules

- Report file paths relative to the monorepo root (e.g. `apps/order-service/src/order/order.service.ts`)
- Do not suggest fixes — only report violations. The developer decides how to fix.
- False positives are better than false negatives — flag anything suspicious
