jest.mock('../config', () => ({
  config: {
    PORT: 3004,
    NODE_ENV: 'test',
    SERVICE_NAME: 'order-service',
    LOG_LEVEL: 'warn',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    CACHE_STORE: 'memory',
    REDIS_URL: 'redis://localhost:6379',
    QUEUE_TRANSPORT: 'rabbitmq',
    RABBITMQ_URL: 'amqp://localhost:5672',
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

const mockOrderService = {
  createOrder: jest.fn(),
  getMyOrders: jest.fn(),
  getOrder: jest.fn(),
  updateOrderStatus: jest.fn(),
};

describe('OrderController', () => {
  let controller: OrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: OrderService, useValue: mockOrderService }],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should extract userId from req.user and call orderService.createOrder', async () => {
      const req = { user: { userId: 'user-uuid', email: 'test@example.com' } };
      const dto = {
        email: 'test@example.com',
        items: [{ productId: 'prod-uuid', productName: 'Widget', quantity: 1, price: 29.99 }],
      };
      const expected = { id: 'order-uuid' };
      mockOrderService.createOrder.mockResolvedValue(expected);

      const result = await controller.create(req, dto);

      expect(mockOrderService.createOrder).toHaveBeenCalledWith('user-uuid', dto);
      expect(result).toBe(expected);
    });
  });

  describe('getMyOrders', () => {
    it('should extract userId from req.user and call orderService.getMyOrders', async () => {
      const req = { user: { userId: 'user-uuid', email: 'test@example.com' } };
      const expected = [{ id: 'order-uuid' }];
      mockOrderService.getMyOrders.mockResolvedValue(expected);

      const result = await controller.getMyOrders(req);

      expect(mockOrderService.getMyOrders).toHaveBeenCalledWith('user-uuid');
      expect(result).toBe(expected);
    });
  });

  describe('getById', () => {
    it('should call orderService.getOrder with id', async () => {
      const expected = { id: 'order-uuid' };
      mockOrderService.getOrder.mockResolvedValue(expected);

      const result = await controller.getById('order-uuid');

      expect(mockOrderService.getOrder).toHaveBeenCalledWith('order-uuid');
      expect(result).toBe(expected);
    });
  });

  describe('updateStatus', () => {
    it('should call orderService.updateOrderStatus with id and dto', async () => {
      const dto = { status: 'CONFIRMED' as any };
      const expected = { id: 'order-uuid', status: 'CONFIRMED' };
      mockOrderService.updateOrderStatus.mockResolvedValue(expected);

      const result = await controller.updateStatus('order-uuid', dto);

      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith('order-uuid', dto);
      expect(result).toBe(expected);
    });
  });
});
