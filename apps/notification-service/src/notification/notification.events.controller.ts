import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  UserRegisteredPayload,
  OrderPlacedPayload,
  OrderStatusUpdatedPayload,
  ORDER_PLACED,
  ORDER_STATUS_UPDATED,
} from '@online-store/shared-types';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationEventsController {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('user.registered')
  handleUserRegistered(@Payload() payload: UserRegisteredPayload): Promise<void> {
    return this.notificationService.handleUserRegistered(payload);
  }

  @EventPattern(ORDER_PLACED)
  handleOrderPlaced(@Payload() payload: OrderPlacedPayload): Promise<void> {
    return this.notificationService.handleOrderPlaced(payload);
  }

  @EventPattern(ORDER_STATUS_UPDATED)
  handleOrderStatusUpdated(@Payload() payload: OrderStatusUpdatedPayload): Promise<void> {
    return this.notificationService.handleOrderStatusUpdated(payload);
  }
}
