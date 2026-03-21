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
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductRepository } from './product.repository';

const mockCache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

describe('ProductRepository', () => {
  let repository: ProductRepository;
  let prisma: PrismaService;

  const now = new Date();
  const mockProduct = {
    id: 'prod-1',
    name: 'Widget',
    description: 'A widget',
    price: new Prisma.Decimal(19.99),
    sku: 'WDG-001',
    categoryId: 'cat-1',
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductRepository,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    repository = module.get(ProductRepository);
    prisma = module.get(PrismaService);
  });

  describe('findAll', () => {
    it('should return products with default args', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);

      const result = await repository.findAll({ limit: 20, offset: 0 });

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: undefined,
        take: 20,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockProduct]);
    });

    it('should filter by categoryId when provided', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

      await repository.findAll({ limit: 10, offset: 5, categoryId: 'cat-1' });

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { categoryId: 'cat-1' },
        take: 10,
        skip: 5,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return product by id', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const result = await repository.findById('prod-1');

      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 'prod-1' } });
      expect(result).toEqual(mockProduct);
    });

    it('should return null when not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('missing');
      expect(result).toBeNull();
    });
  });

  describe('findBySku', () => {
    it('should return product by sku', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const result = await repository.findBySku('WDG-001');

      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { sku: 'WDG-001' } });
      expect(result).toEqual(mockProduct);
    });
  });

  describe('create', () => {
    it('should create a product', async () => {
      const input = { name: 'Widget', description: 'A widget', price: 19.99, sku: 'WDG-001', categoryId: 'cat-1' };
      (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);

      const result = await repository.create(input);

      expect(prisma.product.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(mockProduct);
    });
  });

  describe('update', () => {
    it('should update a product with partial fields', async () => {
      const input = { name: 'Updated Widget' };
      const updated = { ...mockProduct, name: 'Updated Widget' };
      (prisma.product.update as jest.Mock).mockResolvedValue(updated);

      const result = await repository.update('prod-1', input);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { name: 'Updated Widget' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should delete a product', async () => {
      (prisma.product.delete as jest.Mock).mockResolvedValue(mockProduct);

      const result = await repository.delete('prod-1');

      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 'prod-1' } });
      expect(result).toEqual(mockProduct);
    });
  });
});
