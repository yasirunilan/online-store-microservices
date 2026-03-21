import * as dotenv from 'dotenv';
// Load .env.local first so process.env is populated before any module imports run
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { PinoLoggerService } from '@online-store/shared-logger';
import { GlobalExceptionFilter, LoggingInterceptor, RequestIdInterceptor } from '@online-store/shared-middleware';
import { AppModule } from './app.module';
import { config } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new PinoLoggerService(),
  });

  app.useGlobalInterceptors(new RequestIdInterceptor(), new LoggingInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(config.PORT);
}
bootstrap();
