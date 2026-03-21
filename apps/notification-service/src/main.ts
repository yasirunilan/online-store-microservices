import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { GlobalExceptionFilter, LoggingInterceptor, RequestIdInterceptor } from '@online-store/shared-middleware';
import { PinoLoggerService } from '@online-store/shared-logger';
import { AppModule } from './app.module';
import { config } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: new PinoLoggerService() });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [config.RABBITMQ_URL],
      queue: 'online_store_notification_service',
      queueOptions: { durable: true },
      exchange: 'online_store_exchange',
      exchangeType: 'topic',
      wildcards: true,
      noAck: false,
    },
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalInterceptors(new RequestIdInterceptor(), new LoggingInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.startAllMicroservices();
  await app.listen(config.PORT);
}
bootstrap();
