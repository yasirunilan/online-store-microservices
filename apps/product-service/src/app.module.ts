import { join } from 'path';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { SharedMiddlewareModule } from '@online-store/shared-middleware';
import { CategoryModule } from './category/category.module';
import { config } from './config';
import { HealthModule } from './health/health.module';
import { InventoryModule } from './inventory/inventory.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        if (config.CACHE_STORE === 'redis') {
          const { redisStore } = await import('cache-manager-redis-yet');
          return { store: await redisStore({ url: config.REDIS_URL }), ttl: 300_000 };
        }
        return { ttl: 300_000 };
      },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      // Expose the Express request on the GraphQL context so JwtAuthGuard can read it
      context: ({ req }: { req: unknown }) => ({ req }),
    }),
    PrismaModule,
    SharedMiddlewareModule,
    HealthModule,
    CategoryModule,
    InventoryModule,
    ProductModule,
  ],
})
export class AppModule {}
