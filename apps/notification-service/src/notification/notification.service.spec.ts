jest.mock('../config', () => ({
  config: {
    PORT: 3005,
    NODE_ENV: 'test',
    SERVICE_NAME: 'notification-service',
    LOG_LEVEL: 'warn',
    MONGODB_URI: 'mongodb://localhost:27017/test',
    QUEUE_TRANSPORT: 'rabbitmq',
    RABBITMQ_URL: 'amqp://localhost:5672',
    MAIL_HOST: 'localhost',
    MAIL_PORT: 1025,
    MAIL_FROM: 'test@test.com',
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { NotificationEmailService } from './notification.email.service';

const mockNotificationRepository = {
  create: jest.fn(),
  findByUserId: jest.fn(),
  findAll: jest.fn(),
};

const mockNotificationEmailService = {
  sendWelcomeEmail: jest.fn(),
  sendOrderConfirmationEmail: jest.fn(),
  sendOrderStatusUpdateEmail: jest.fn(),
};

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: NotificationRepository, useValue: mockNotificationRepository },
        { provide: NotificationEmailService, useValue: mockNotificationEmailService },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
  });

  describe('handleUserRegistered', () => {
    const payload = {
      userId: 'user-uuid',
      email: 'test@example.com',
      registeredAt: new Date().toISOString(),
    };

    it('should send welcome email and save notification with status sent', async () => {
      mockNotificationEmailService.sendWelcomeEmail.mockResolvedValue(undefined);
      mockNotificationRepository.create.mockResolvedValue({});

      await service.handleUserRegistered(payload);

      expect(mockNotificationEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'test@example.com',
        'user-uuid',
      );
      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        type: 'welcome_email',
        recipientEmail: 'test@example.com',
        recipientUserId: 'user-uuid',
        payload: payload as unknown as Record<string, unknown>,
        status: 'sent',
        errorMessage: undefined,
      });
    });

    it('should save notification with failed status when email fails', async () => {
      mockNotificationEmailService.sendWelcomeEmail.mockRejectedValue(new Error('SMTP error'));
      mockNotificationRepository.create.mockResolvedValue({});

      await service.handleUserRegistered(payload);

      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        type: 'welcome_email',
        recipientEmail: 'test@example.com',
        recipientUserId: 'user-uuid',
        payload: payload as unknown as Record<string, unknown>,
        status: 'failed',
        errorMessage: 'SMTP error',
      });
    });
  });

  describe('handleOrderPlaced', () => {
    const payload = {
      orderId: 'order-uuid',
      userId: 'user-uuid',
      email: 'test@example.com',
      items: [{ productId: 'prod-uuid', productName: 'Widget', quantity: 1, price: 29.99 }],
      totalAmount: 29.99,
      placedAt: new Date().toISOString(),
    };

    it('should send order confirmation email and save notification', async () => {
      mockNotificationEmailService.sendOrderConfirmationEmail.mockResolvedValue(undefined);
      mockNotificationRepository.create.mockResolvedValue({});

      await service.handleOrderPlaced(payload);

      expect(mockNotificationEmailService.sendOrderConfirmationEmail).toHaveBeenCalledWith(
        'test@example.com',
        payload,
      );
      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        type: 'order_confirmation',
        recipientEmail: 'test@example.com',
        recipientUserId: 'user-uuid',
        payload: payload as unknown as Record<string, unknown>,
        status: 'sent',
        errorMessage: undefined,
      });
    });

    it('should save with failed status when email fails', async () => {
      mockNotificationEmailService.sendOrderConfirmationEmail.mockRejectedValue(
        new Error('Connection refused'),
      );
      mockNotificationRepository.create.mockResolvedValue({});

      await service.handleOrderPlaced(payload);

      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          errorMessage: 'Connection refused',
        }),
      );
    });
  });

  describe('handleOrderStatusUpdated', () => {
    const payload = {
      orderId: 'order-uuid',
      userId: 'user-uuid',
      email: 'test@example.com',
      previousStatus: 'PENDING',
      newStatus: 'CONFIRMED',
      updatedAt: new Date().toISOString(),
    };

    it('should send status update email and save notification', async () => {
      mockNotificationEmailService.sendOrderStatusUpdateEmail.mockResolvedValue(undefined);
      mockNotificationRepository.create.mockResolvedValue({});

      await service.handleOrderStatusUpdated(payload);

      expect(mockNotificationEmailService.sendOrderStatusUpdateEmail).toHaveBeenCalledWith(
        'test@example.com',
        payload,
      );
      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        type: 'order_status_update',
        recipientEmail: 'test@example.com',
        recipientUserId: 'user-uuid',
        payload: payload as unknown as Record<string, unknown>,
        status: 'sent',
        errorMessage: undefined,
      });
    });

    it('should save with failed status when email fails', async () => {
      mockNotificationEmailService.sendOrderStatusUpdateEmail.mockRejectedValue(
        new Error('Timeout'),
      );
      mockNotificationRepository.create.mockResolvedValue({});

      await service.handleOrderStatusUpdated(payload);

      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          errorMessage: 'Timeout',
        }),
      );
    });
  });
});
