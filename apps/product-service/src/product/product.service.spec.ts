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

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import { CategoryRepository } from '../category/category.repository';
import { InventoryRepository } from '../inventory/inventory.repository';
import { ProductRepository } from './product.repository';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let productRepo: jest.Mocked<ProductRepository>;
  let categoryRepo: jest.Mocked<CategoryRepository>;
  let inventoryRepo: jest.Mocked<InventoryRepository>;

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
  const mockCategory = { id: 'cat-1', name: 'Electronics', createdAt: now, updatedAt: now };
  const mockInventory = { id: 'inv-1', productId: 'prod-1', quantity: 0, reservedQuantity: 0, updatedAt: now };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: ProductRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            findBySku: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: CategoryRepository,
          useValue: { findById: jest.fn() },
        },
        {
          provide: InventoryRepository,
          useValue: { createForProduct: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ProductService);
    productRepo = module.get(ProductRepository) as jest.Mocked<ProductRepository>;
    categoryRepo = module.get(CategoryRepository) as jest.Mocked<CategoryRepository>;
    inventoryRepo = module.get(InventoryRepository) as jest.Mocked<InventoryRepository>;
  });

  describe('findAll', () => {
    it('should delegate to repository', async () => {
      productRepo.findAll.mockResolvedValue([mockProduct]);

      const result = await service.findAll({ limit: 20, offset: 0 });

      expect(productRepo.findAll).toHaveBeenCalledWith({ limit: 20, offset: 0 });
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('findById', () => {
    it('should return the product when found', async () => {
      productRepo.findById.mockResolvedValue(mockProduct);

      const result = await service.findById('prod-1');
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when not found', async () => {
      productRepo.findById.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const input = { name: 'Widget', description: 'A widget', price: 19.99, sku: 'WDG-001', categoryId: 'cat-1' };

    it('should create product and inventory', async () => {
      categoryRepo.findById.mockResolvedValue(mockCategory);
      productRepo.findBySku.mockResolvedValue(null);
      productRepo.create.mockResolvedValue(mockProduct);
      inventoryRepo.createForProduct.mockResolvedValue(mockInventory);

      const result = await service.create(input);

      expect(categoryRepo.findById).toHaveBeenCalledWith('cat-1');
      expect(productRepo.findBySku).toHaveBeenCalledWith('WDG-001');
      expect(productRepo.create).toHaveBeenCalledWith(input);
      expect(inventoryRepo.createForProduct).toHaveBeenCalledWith('prod-1');
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when category not found', async () => {
      categoryRepo.findById.mockResolvedValue(null);

      await expect(service.create(input)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when SKU already exists', async () => {
      categoryRepo.findById.mockResolvedValue(mockCategory);
      productRepo.findBySku.mockResolvedValue(mockProduct);

      await expect(service.create(input)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const input = { name: 'Updated Widget' };

    it('should update the product', async () => {
      productRepo.findById.mockResolvedValue(mockProduct);
      const updated = { ...mockProduct, name: 'Updated Widget' };
      productRepo.update.mockResolvedValue(updated);

      const result = await service.update('prod-1', input);

      expect(productRepo.update).toHaveBeenCalledWith('prod-1', input);
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepo.findById.mockResolvedValue(null);

      await expect(service.update('missing', input)).rejects.toThrow(NotFoundException);
    });

    it('should validate category when categoryId provided', async () => {
      productRepo.findById.mockResolvedValue(mockProduct);
      categoryRepo.findById.mockResolvedValue(null);

      await expect(service.update('prod-1', { categoryId: 'bad-cat' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when SKU taken by another product', async () => {
      productRepo.findById.mockResolvedValue(mockProduct);
      productRepo.findBySku.mockResolvedValue({ ...mockProduct, id: 'prod-2' });

      await expect(service.update('prod-1', { sku: 'WDG-001' })).rejects.toThrow(ConflictException);
    });

    it('should allow same SKU for the same product', async () => {
      productRepo.findById.mockResolvedValue(mockProduct);
      productRepo.findBySku.mockResolvedValue(mockProduct);
      productRepo.update.mockResolvedValue(mockProduct);

      const result = await service.update('prod-1', { sku: 'WDG-001' });
      expect(result).toEqual(mockProduct);
    });
  });

  describe('delete', () => {
    it('should delete the product and return true', async () => {
      productRepo.findById.mockResolvedValue(mockProduct);
      productRepo.delete.mockResolvedValue(mockProduct);

      const result = await service.delete('prod-1');
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepo.findById.mockResolvedValue(null);

      await expect(service.delete('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
