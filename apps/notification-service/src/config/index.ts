import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().default(3005),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SERVICE_NAME: z.string().default('notification-service'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  MONGODB_URI: z.string(),
  QUEUE_TRANSPORT: z.enum(['rabbitmq', 'sqs']).default('rabbitmq'),
  RABBITMQ_URL: z.string().default('amqp://guest:guest@localhost:5672'),
  // Email config
  MAIL_HOST: z.string().default('localhost'),
  MAIL_PORT: z.coerce.number().default(1025),
  MAIL_FROM: z.string().default('no-reply@online-store.local'),
  JWT_PUBLIC_KEY: z.string(),
});

export type AppConfig = z.infer<typeof configSchema>;

export const config = configSchema.parse(process.env);
