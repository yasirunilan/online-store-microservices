import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { config } from './config';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';

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
    PrismaModule,
    HealthModule,
    UserModule,
  ],
})
export class AppModule {}
