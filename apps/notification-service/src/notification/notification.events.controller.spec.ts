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
import { NotificationEventsController } from './notification.events.controller';
import { NotificationService } from './notification.service';

const mockNotificationService = {
  handleUserRegistered: jest.fn(),
  handleOrderPlaced: jest.fn(),
  handleOrderStatusUpdated: jest.fn(),
};

describe('NotificationEventsController', () => {
  let controller: NotificationEventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationEventsController],
      providers: [{ provide: NotificationService, useValue: mockNotificationService }],
    }).compile();

    controller = module.get<NotificationEventsController>(NotificationEventsController);
    jest.clearAllMocks();
  });

  describe('handleUserRegistered', () => {
    it('should delegate to notificationService.handleUserRegistered', async () => {
      const payload = {
        userId: 'user-uuid',
        email: 'test@example.com',
        registeredAt: new Date().toISOString(),
      };
      mockNotificationService.handleUserRegistered.mockResolvedValue(undefined);

      await controller.handleUserRegistered(payload);

      expect(mockNotificationService.handleUserRegistered).toHaveBeenCalledWith(payload);
    });
  });

  describe('handleOrderPlaced', () => {
    it('should delegate to notificationService.handleOrderPlaced', async () => {
      const payload = {
        orderId: 'order-uuid',
        userId: 'user-uuid',
        email: 'test@example.com',
        items: [{ productId: 'prod-uuid', productName: 'Widget', quantity: 1, price: 29.99 }],
        totalAmount: 29.99,
        placedAt: new Date().toISOString(),
      };
      mockNotificationService.handleOrderPlaced.mockResolvedValue(undefined);

      await controller.handleOrderPlaced(payload);

      expect(mockNotificationService.handleOrderPlaced).toHaveBeenCalledWith(payload);
    });
  });

  describe('handleOrderStatusUpdated', () => {
    it('should delegate to notificationService.handleOrderStatusUpdated', async () => {
      const payload = {
        orderId: 'order-uuid',
        userId: 'user-uuid',
        email: 'test@example.com',
        previousStatus: 'PENDING',
        newStatus: 'CONFIRMED',
        updatedAt: new Date().toISOString(),
      };
      mockNotificationService.handleOrderStatusUpdated.mockResolvedValue(undefined);

      await controller.handleOrderStatusUpdated(payload);

      expect(mockNotificationService.handleOrderStatusUpdated).toHaveBeenCalledWith(payload);
    });
  });
});
