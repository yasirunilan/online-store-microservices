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
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Prisma } from '../generated/prisma/client';
import { OrderRepository } from './order.repository';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

const mockCache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

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

describe('OrderRepository', () => {
  let repository: OrderRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderRepository,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    repository = module.get<OrderRepository>(OrderRepository);
  });

  describe('create', () => {
    it('should create an order with items', async () => {
      mockPrismaService.order.create.mockResolvedValue(mockOrder);

      const data = {
        userId: 'user-uuid',
        email: 'test@example.com',
        totalAmount: 29.99,
        items: [{ productId: 'prod-uuid', productName: 'Widget', quantity: 1, price: 29.99 }],
      };

      const result = await repository.create(data);

      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-uuid',
          email: 'test@example.com',
          totalAmount: expect.any(Prisma.Decimal),
          items: {
            create: [
              {
                productId: 'prod-uuid',
                productName: 'Widget',
                quantity: 1,
                price: expect.any(Prisma.Decimal),
              },
            ],
          },
        },
        include: { items: true },
      });
      expect(result).toBe(mockOrder);
    });
  });

  describe('findById', () => {
    it('should find an order by id', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await repository.findById('order-uuid');

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-uuid' },
        include: { items: true },
      });
      expect(result).toBe(mockOrder);
    });
  });

  describe('findByUserId', () => {
    it('should find orders by userId', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([mockOrder]);

      const result = await repository.findByUserId('user-uuid');

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid' },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockOrder]);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const updatedOrder = { ...mockOrder, status: 'CONFIRMED' };
      mockPrismaService.order.update.mockResolvedValue(updatedOrder);

      const result = await repository.updateStatus('order-uuid', 'CONFIRMED');

      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-uuid' },
        data: { status: 'CONFIRMED' },
        include: { items: true },
      });
      expect(result).toBe(updatedOrder);
    });
  });

  describe('findAll', () => {
    it('should find all orders with pagination', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([mockOrder]);

      const result = await repository.findAll({ skip: 0, take: 10 });

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockOrder]);
    });
  });
});
