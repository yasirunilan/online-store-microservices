jest.mock('../config', () => ({
  config: {
    PORT: 3003,
    NODE_ENV: 'test',
    SERVICE_NAME: 'product-service',
    LOG_LEVEL: 'warn',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    CACHE_STORE: 'memory',
    REDIS_URL: 'redis://localhost:6379',
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryRepository } from './inventory.repository';

const mockCache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

describe('InventoryRepository', () => {
  let repository: InventoryRepository;
  let prisma: PrismaService;

  const now = new Date();
  const mockInventory = { id: 'inv-1', productId: 'prod-1', quantity: 10, reservedQuantity: 0, updatedAt: now };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryRepository,
        {
          provide: PrismaService,
          useValue: {
            inventory: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              upsert: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    repository = module.get(InventoryRepository);
    prisma = module.get(PrismaService);
  });

  describe('findByProductId', () => {
    it('should return inventory for a product', async () => {
      (prisma.inventory.findUnique as jest.Mock).mockResolvedValue(mockInventory);

      const result = await repository.findByProductId('prod-1');

      expect(prisma.inventory.findUnique).toHaveBeenCalledWith({ where: { productId: 'prod-1' } });
      expect(result).toEqual(mockInventory);
    });

    it('should return null when not found', async () => {
      (prisma.inventory.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByProductId('missing');
      expect(result).toBeNull();
    });
  });

  describe('findByProductIds', () => {
    it('should return inventories for multiple products', async () => {
      const inventories = [mockInventory, { ...mockInventory, id: 'inv-2', productId: 'prod-2' }];
      (prisma.inventory.findMany as jest.Mock).mockResolvedValue(inventories);

      const result = await repository.findByProductIds(['prod-1', 'prod-2']);

      expect(prisma.inventory.findMany).toHaveBeenCalledWith({
        where: { productId: { in: ['prod-1', 'prod-2'] } },
      });
      expect(result).toEqual(inventories);
    });
  });

  describe('upsert', () => {
    it('should upsert inventory for a product', async () => {
      (prisma.inventory.upsert as jest.Mock).mockResolvedValue(mockInventory);

      const result = await repository.upsert('prod-1', 10);

      expect(prisma.inventory.upsert).toHaveBeenCalledWith({
        where: { productId: 'prod-1' },
        create: { productId: 'prod-1', quantity: 10 },
        update: { quantity: 10 },
      });
      expect(result).toEqual(mockInventory);
    });
  });

  describe('createForProduct', () => {
    it('should create default inventory for a product', async () => {
      (prisma.inventory.create as jest.Mock).mockResolvedValue({ ...mockInventory, quantity: 0 });

      const result = await repository.createForProduct('prod-1');

      expect(prisma.inventory.create).toHaveBeenCalledWith({ data: { productId: 'prod-1' } });
      expect(result).toEqual({ ...mockInventory, quantity: 0 });
    });
  });
});
