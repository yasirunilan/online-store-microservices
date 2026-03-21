import { Module } from '@nestjs/common';
import { SharedMiddlewareModule } from '@online-store/shared-middleware';
import { QueueClientModule } from '@online-store/queue-client';
import { OrderController } from './order.controller';
import { OrderRepository } from './order.repository';
import { OrderService } from './order.service';

@Module({
  imports: [SharedMiddlewareModule, QueueClientModule.register()],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository],
})
export class OrderModule {}
