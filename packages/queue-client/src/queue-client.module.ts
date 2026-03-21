import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

export const QUEUE_CLIENT = 'QUEUE_CLIENT';

@Module({})
export class QueueClientModule {
  static register(): DynamicModule {
    const transport = process.env.QUEUE_TRANSPORT ?? 'rabbitmq';

    // SQS uses a custom transport (not built into @nestjs/microservices).
    // The RMQ branch is active locally; SQS will be wired via a custom
    // transport adapter when deploying to AWS in a later phase.
    const rmqOptions = {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
      queue: 'online_store_publisher',
      queueOptions: { durable: true },
      exchange: 'online_store_exchange',
      exchangeType: 'topic',
      wildcards: true,
    };

    const imports = [
      ClientsModule.register([
        {
          name: QUEUE_CLIENT,
          transport: Transport.RMQ,
          options: rmqOptions,
        },
      ]),
    ];

    return {
      module: QueueClientModule,
      imports,
      exports: [ClientsModule],
    };
  }
}
