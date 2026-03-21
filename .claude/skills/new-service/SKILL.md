---
name: new-service
description: Scaffold a new NestJS microservice in the monorepo following the project's established structure and conventions. Use when adding a new service.
argument-hint: <service-name> [rest|graphql] [postgres|mongo]
allowed-tools: Bash, Read, Write, Edit, Glob
---

# Scaffold New NestJS Service

Create a new microservice under `apps/` following the project's established NestJS patterns.

## Parse arguments

From `$ARGUMENTS`:
- `$0` — service name in kebab-case (e.g. `payment-service`). Required — stop and ask if missing.
- `$1` — API style: `rest` (default) or `graphql`
- `$2` — database: `postgres` (default) or `mongo`

Derive the domain name from the service name (e.g. `payment-service` → domain `payment`).

## Steps

1. Confirm the service does not already exist under `apps/`
2. Create the full directory structure (see below)
3. Generate each file from the templates below, substituting `<service-name>` and `<domain>`
4. Register the service in `pnpm-workspace.yaml` and `turbo.json`
5. List all created files and remind the user to run `pnpm install` from the monorepo root

## Directory structure to create

```
apps/<service-name>/
├── src/
│   ├── <domain>/
│   │   ├── <domain>.module.ts
│   │   ├── <domain>.controller.ts     # (REST only)
│   │   ├── <domain>.resolver.ts       # (GraphQL only)
│   │   ├── <domain>.service.ts
│   │   ├── <domain>.repository.ts
│   │   ├── dto/
│   │   │   ├── create-<domain>.dto.ts
│   │   │   └── update-<domain>.dto.ts
│   │   └── events/
│   │       ├── <domain>.publisher.ts
│   │       └── <domain>.consumer.ts
│   ├── common/
│   │   └── guards/
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma                  # (postgres only)
├── Dockerfile
├── .env.example
├── package.json
└── tsconfig.json
```

## File templates

### `src/main.ts`
```typescript
import { NestFactory } from '@nestjs/core'
import { ValidationPipe, VersioningType } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'  // omit for graphql
import { LoggingInterceptor } from '@online-store/shared-middleware'
import { AppModule } from './app.module'
import { config } from './config'                                  // validated at import time

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new LoggingInterceptor())

  // REST only: Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('<service-name>')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig))

  await app.listen(config.PORT)
}

bootstrap()
```

### `src/app.module.ts` (REST + postgres)
```typescript
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CacheModule } from '@nestjs/cache-manager'
import { SharedMiddlewareModule } from '@online-store/shared-middleware'
import { QueueClientModule } from '@online-store/queue-client'
import { PrismaModule } from './prisma/prisma.module'
import { <Domain>Module } from './<domain>/<domain>.module'
import { cacheConfig } from './config/cache.config'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({ isGlobal: true, useFactory: cacheConfig }),
    SharedMiddlewareModule,
    QueueClientModule,
    PrismaModule,
    <Domain>Module,
  ],
})
export class AppModule {}
```

### `src/app.module.ts` (GraphQL + postgres)
```typescript
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CacheModule } from '@nestjs/cache-manager'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { SharedMiddlewareModule } from '@online-store/shared-middleware'
import { QueueClientModule } from '@online-store/queue-client'
import { PrismaModule } from './prisma/prisma.module'
import { <Domain>Module } from './<domain>/<domain>.module'
import { cacheConfig } from './config/cache.config'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({ isGlobal: true, useFactory: cacheConfig }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
    }),
    SharedMiddlewareModule,
    QueueClientModule,
    PrismaModule,
    <Domain>Module,
  ],
})
export class AppModule {}
```

### `src/config/index.ts`
```typescript
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SERVICE_NAME: z.string(),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DATABASE_URL: z.string().url(),
  QUEUE_TRANSPORT: z.enum(['rabbitmq', 'sqs']).default('rabbitmq'),
  RABBITMQ_URL: z.string().default('amqp://localhost:5672'),
  CACHE_STORE: z.enum(['memory', 'redis']).default('memory'),
  REDIS_URL: z.string().optional(),
})

export const config = schema.parse(process.env)
export type Config = z.infer<typeof schema>
```

### `src/config/cache.config.ts`
```typescript
import { CacheModuleOptions } from '@nestjs/cache-manager'
import { config } from '.'

export async function cacheConfig(): Promise<CacheModuleOptions> {
  if (config.CACHE_STORE === 'redis') {
    const { redisStore } = await import('cache-manager-ioredis-yet')
    return { store: redisStore, url: config.REDIS_URL, ttl: 60 }
  }
  return { ttl: 60 }  // in-memory
}
```

### `src/<domain>/<domain>.module.ts`
```typescript
import { Module } from '@nestjs/common'
import { <Domain>Controller } from './<domain>.controller'  // or Resolver
import { <Domain>Service } from './<domain>.service'
import { <Domain>Repository } from './<domain>.repository'

@Module({
  controllers: [<Domain>Controller],
  providers: [<Domain>Service, <Domain>Repository],
  exports: [<Domain>Service],
})
export class <Domain>Module {}
```

### `src/<domain>/<domain>.controller.ts` (REST)
```typescript
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, VERSION_NEUTRAL } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '@online-store/shared-middleware'
import { <Domain>Service } from './<domain>.service'
import { Create<Domain>Dto } from './dto/create-<domain>.dto'

@ApiTags('<domain>')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1', path: '<domain>' })
export class <Domain>Controller {
  constructor(private readonly <domain>Service: <Domain>Service) {}

  @Get()
  findAll() {
    return this.<domain>Service.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.<domain>Service.findOne(id)
  }

  @Post()
  create(@Body() dto: Create<Domain>Dto) {
    return this.<domain>Service.create(dto)
  }
}

// Health check — VERSION_NEUTRAL so it is never prefixed with /v1/
@Controller({ version: VERSION_NEUTRAL, path: 'health' })
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' }
  }
}
```

### `src/<domain>/<domain>.service.ts`
```typescript
import { Injectable, NotFoundException } from '@nestjs/common'
import { Logger } from '@online-store/shared-logger'
import { <Domain>Repository } from './<domain>.repository'
import { Create<Domain>Dto } from './dto/create-<domain>.dto'

@Injectable()
export class <Domain>Service {
  private readonly logger = new Logger(<Domain>Service.name)

  constructor(private readonly repo: <Domain>Repository) {}

  findAll() {
    return this.repo.findAll()
  }

  async findOne(id: string) {
    const item = await this.repo.findById(id)
    if (!item) throw new NotFoundException(`<Domain> ${id} not found`)
    return item
  }

  async create(dto: Create<Domain>Dto) {
    const item = await this.repo.create(dto)
    this.logger.log({ id: item.id }, '<Domain> created')
    return item
  }
}
```

### `src/<domain>/<domain>.repository.ts` (postgres)
```typescript
import { Injectable, Inject } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { PrismaService } from '../prisma/prisma.service'
import { Create<Domain>Dto } from './dto/create-<domain>.dto'

@Injectable()
export class <Domain>Repository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll() {
    const cached = await this.cache.get('<domain>:all')
    if (cached) return cached

    const results = await this.prisma.<domain>.findMany()
    await this.cache.set('<domain>:all', results, 60)
    return results
  }

  findById(id: string) {
    return this.prisma.<domain>.findUnique({ where: { id } })
  }

  async create(dto: Create<Domain>Dto) {
    await this.cache.del('<domain>:all')
    return this.prisma.<domain>.create({ data: dto })
  }
}
```

### `src/<domain>/events/<domain>.publisher.ts`
```typescript
import { Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { InjectQueueClient } from '@online-store/queue-client'

@Injectable()
export class <Domain>Publisher {
  constructor(@InjectQueueClient() private readonly client: ClientProxy) {}

  emit<TPayload>(pattern: string, payload: TPayload) {
    return this.client.emit(pattern, payload)
  }
}
```

### `src/<domain>/events/<domain>.consumer.ts`
```typescript
import { Controller } from '@nestjs/common'
import { EventPattern, Payload } from '@nestjs/microservices'
import { Logger } from '@online-store/shared-logger'

@Controller()
export class <Domain>Consumer {
  private readonly logger = new Logger(<Domain>Consumer.name)

  @EventPattern('<domain>.some-event')
  async handleSomeEvent(@Payload() payload: unknown) {
    this.logger.log({ payload }, 'Handling <domain>.some-event')
    // TODO: implement handler
  }
}
```

### `prisma/schema.prisma` (postgres)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Add models here
```

### `Dockerfile`
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### `package.json`
```json
{
  "name": "@online-store/<service-name>",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main.js",
    "lint": "eslint src",
    "test": "jest",
    "test:e2e": "jest --config jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/cache-manager": "^2.0.0",
    "@nestjs/microservices": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@online-store/shared-types": "workspace:*",
    "@online-store/shared-middleware": "workspace:*",
    "@online-store/shared-logger": "workspace:*",
    "@online-store/queue-client": "workspace:*",
    "cache-manager": "^5.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "reflect-metadata": "^0.1.14",
    "rxjs": "^7.8.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

### `tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  },
  "include": ["src"]
}
```

### `.env.example`
```
NODE_ENV=development
SERVICE_NAME=<service-name>
PORT=3000
LOG_LEVEL=debug
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/online_store?schema=<service-name>
QUEUE_TRANSPORT=rabbitmq
RABBITMQ_URL=amqp://localhost:5672
CACHE_STORE=memory
REDIS_URL=redis://localhost:6379
```

## Rules

- Service name must be kebab-case and end with `-service`
- `emitDecoratorMetadata` and `experimentalDecorators` must be enabled in tsconfig — NestJS requires them
- Config is validated via zod in `src/config/index.ts` — never access `process.env` directly elsewhere
- Never import from sibling services — use `shared-types` for cross-service types
- Cache at the repository layer, not the service layer — keeps business logic clean
- GraphQL services omit `@nestjs/swagger` and REST controller; add `@nestjs/graphql` and resolver instead
- After scaffolding, remind the user to run `pnpm install` from the monorepo root
