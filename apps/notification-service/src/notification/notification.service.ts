import { Injectable, Logger } from '@nestjs/common';
import {
  UserRegisteredPayload,
  OrderPlacedPayload,
  OrderStatusUpdatedPayload,
} from '@online-store/shared-types';
import { NotificationRepository } from './notification.repository';
import { NotificationEmailService } from './notification.email.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationEmailService: NotificationEmailService,
  ) {}

  async handleUserRegistered(payload: UserRegisteredPayload): Promise<void> {
    let status = 'sent';
    let errorMessage: string | undefined;

    try {
      await this.notificationEmailService.sendWelcomeEmail(payload.email, payload.userId);
    } catch (error) {
      status = 'failed';
      errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send welcome email to ${payload.email}: ${errorMessage}`);
    }

    await this.notificationRepository.create({
      type: 'welcome_email',
      recipientEmail: payload.email,
      recipientUserId: payload.userId,
      payload: payload as unknown as Record<string, unknown>,
      status,
      errorMessage,
    });
  }

  async handleOrderPlaced(payload: OrderPlacedPayload): Promise<void> {
    let status = 'sent';
    let errorMessage: string | undefined;

    try {
      await this.notificationEmailService.sendOrderConfirmationEmail(payload.email, payload);
    } catch (error) {
      status = 'failed';
      errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send order confirmation email to ${payload.email}: ${errorMessage}`);
    }

    await this.notificationRepository.create({
      type: 'order_confirmation',
      recipientEmail: payload.email,
      recipientUserId: payload.userId,
      payload: payload as unknown as Record<string, unknown>,
      status,
      errorMessage,
    });
  }

  async handleOrderStatusUpdated(payload: OrderStatusUpdatedPayload): Promise<void> {
    let status = 'sent';
    let errorMessage: string | undefined;

    try {
      await this.notificationEmailService.sendOrderStatusUpdateEmail(payload.email, payload);
    } catch (error) {
      status = 'failed';
      errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send order status update email to ${payload.email}: ${errorMessage}`);
    }

    await this.notificationRepository.create({
      type: 'order_status_update',
      recipientEmail: payload.email,
      recipientUserId: payload.userId,
      payload: payload as unknown as Record<string, unknown>,
      status,
      errorMessage,
    });
  }
}
