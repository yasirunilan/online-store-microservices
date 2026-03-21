import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SERVICE_NAME: z.string().default('auth-service'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url(),
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  CACHE_STORE: z.enum(['memory', 'redis']).default('memory'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  QUEUE_TRANSPORT: z.enum(['rabbitmq', 'sqs']).default('rabbitmq'),
  RABBITMQ_URL: z.string().default('amqp://localhost:5672'),
});

export type AppConfig = z.infer<typeof configSchema>;

export const config = configSchema.parse(process.env);
