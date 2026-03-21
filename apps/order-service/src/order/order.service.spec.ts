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
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';

const mockOrderRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  updateStatus: jest.fn(),
  findAll: jest.fn(),
};

const mockQueueClient = {
  emit: jest.fn(),
};

const now = new Date();

const mockOrder = {
  id: 'order-uuid',
  userId: 'user-uuid',
  email: 'test@example.com',
  status: 'PENDING',
  totalAmount: new Prisma.Decimal(29.99),
  items: [
    {
      id: 'item-uuid',
      orderId: 'order-uuid',
      productId: 'prod-uuid',
      productName: 'Widget',
      quantity: 1,
      price: new Prisma.Decimal(29.99),
    },
  ],
  createdAt: now,
  updatedAt: now,
};

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: OrderRepository, useValue: mockOrderRepository },
        { provide: 'QUEUE_CLIENT', useValue: mockQueueClient },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should calculate totalAmount from items, create order, and emit ORDER_PLACED', async () => {
      const dto = {
        email: 'test@example.com',
        items: [
          { productId: 'prod-uuid', productName: 'Widget', quantity: 2, price: 15.0 },
          { productId: 'prod-uuid-2', productName: 'Gadget', quantity: 1, price: 10.0 },
        ],
      };

      const createdOrder = {
        ...mockOrder,
        totalAmount: new Prisma.Decimal(40.0),
        createdAt: now,
      };
      mockOrderRepository.create.mockResolvedValue(createdOrder);

      const result = await service.createOrder('user-uuid', dto);

      expect(mockOrderRepository.create).toHaveBeenCalledWith({
        userId: 'user-uuid',
        email: 'test@example.com',
        totalAmount: 40.0,
        items: dto.items,
      });
      expect(mockQueueClient.emit).toHaveBeenCalledWith('order.placed', {
        orderId: createdOrder.id,
        userId: 'user-uuid',
        email: 'test@example.com',
        items: [
          { productId: 'prod-uuid', productName: 'Widget', quantity: 2, price: 15.0 },
          { productId: 'prod-uuid-2', productName: 'Gadget', quantity: 1, price: 10.0 },
        ],
        totalAmount: 40.0,
        placedAt: now.toISOString(),
      });
      expect(result).toBe(createdOrder);
    });
  });

  describe('getOrder', () => {
    it('should return the order when found', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);

      const result = await service.getOrder('order-uuid');

      expect(mockOrderRepository.findById).toHaveBeenCalledWith('order-uuid');
      expect(result).toBe(mockOrder);
    });

    it('should throw NotFoundException when not found', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(service.getOrder('missing-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyOrders', () => {
    it('should return orders for the user', async () => {
      const orders = [mockOrder];
      mockOrderRepository.findByUserId.mockResolvedValue(orders);

      const result = await service.getMyOrders('user-uuid');

      expect(mockOrderRepository.findByUserId).toHaveBeenCalledWith('user-uuid');
      expect(result).toBe(orders);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update status and emit ORDER_STATUS_UPDATED', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      const updatedOrder = { ...mockOrder, status: 'CONFIRMED', updatedAt: now };
      mockOrderRepository.updateStatus.mockResolvedValue(updatedOrder);

      const result = await service.updateOrderStatus('order-uuid', { status: 'CONFIRMED' as any });

      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith('order-uuid', 'CONFIRMED');
      expect(mockQueueClient.emit).toHaveBeenCalledWith('order.status.updated', {
        orderId: 'order-uuid',
        userId: 'user-uuid',
        email: 'test@example.com',
        previousStatus: 'PENDING',
        newStatus: 'CONFIRMED',
        updatedAt: now.toISOString(),
      });
      expect(result).toBe(updatedOrder);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus('missing-uuid', { status: 'CONFIRMED' as any }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
