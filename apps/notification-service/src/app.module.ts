import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthModule } from './health/health.module';
import { NotificationModule } from './notification/notification.module';
import { config } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(config.MONGODB_URI),
    HealthModule,
    NotificationModule,
  ],
})
export class AppModule {}
