import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().default(3002),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SERVICE_NAME: z.string().default('user-service'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url(),
  CACHE_STORE: z.enum(['memory', 'redis']).default('memory'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  QUEUE_TRANSPORT: z.enum(['rabbitmq', 'sqs']).default('rabbitmq'),
  RABBITMQ_URL: z.string().default('amqp://localhost:5672'),
});

export type AppConfig = z.infer<typeof configSchema>;

export const config = configSchema.parse(process.env);
