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
import { Prisma } from '../generated/prisma/client';
import { DataLoadersService } from './data-loaders.service';
import { ProductResolver } from './product.resolver';
import { ProductService } from './product.service';

describe('ProductResolver', () => {
  let resolver: ProductResolver;
  let productService: jest.Mocked<ProductService>;
  let dataLoaders: jest.Mocked<DataLoadersService>;

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
  const mockInventory = { id: 'inv-1', productId: 'prod-1', quantity: 10, reservedQuantity: 0, updatedAt: now };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductResolver,
        {
          provide: ProductService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: DataLoadersService,
          useValue: {
            categoryLoader: { load: jest.fn() },
            inventoryLoader: { load: jest.fn() },
          },
        },
      ],
    }).compile();

    resolver = await module.resolve(ProductResolver);
    productService = await module.resolve(ProductService) as jest.Mocked<ProductService>;
    dataLoaders = await module.resolve(DataLoadersService) as jest.Mocked<DataLoadersService>;
  });

  describe('products query', () => {
    it('should return all products', async () => {
      productService.findAll.mockResolvedValue([mockProduct]);

      const result = await resolver.products({ limit: 20, offset: 0 });

      expect(productService.findAll).toHaveBeenCalledWith({ limit: 20, offset: 0 });
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('product query', () => {
    it('should return a product by id', async () => {
      productService.findById.mockResolvedValue(mockProduct);

      const result = await resolver.product('prod-1');

      expect(productService.findById).toHaveBeenCalledWith('prod-1');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('createProduct mutation', () => {
    it('should create and return a product', async () => {
      const input = { name: 'Widget', price: 19.99, sku: 'WDG-001', categoryId: 'cat-1' };
      productService.create.mockResolvedValue(mockProduct);

      const result = await resolver.createProduct(input);

      expect(productService.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('updateProduct mutation', () => {
    it('should update and return a product', async () => {
      const input = { name: 'Updated Widget' };
      const updated = { ...mockProduct, name: 'Updated Widget' };
      productService.update.mockResolvedValue(updated);

      const result = await resolver.updateProduct('prod-1', input);

      expect(productService.update).toHaveBeenCalledWith('prod-1', input);
      expect(result).toEqual(updated);
    });
  });

  describe('deleteProduct mutation', () => {
    it('should delete and return true', async () => {
      productService.delete.mockResolvedValue(true);

      const result = await resolver.deleteProduct('prod-1');

      expect(productService.delete).toHaveBeenCalledWith('prod-1');
      expect(result).toBe(true);
    });
  });

  describe('category field resolver', () => {
    it('should load category via dataloader', async () => {
      (dataLoaders.categoryLoader.load as jest.Mock).mockResolvedValue(mockCategory);

      const result = await resolver.category({ categoryId: 'cat-1' } as any);

      expect(dataLoaders.categoryLoader.load).toHaveBeenCalledWith('cat-1');
      expect(result).toEqual(mockCategory);
    });
  });

  describe('inventory field resolver', () => {
    it('should load inventory via dataloader', async () => {
      (dataLoaders.inventoryLoader.load as jest.Mock).mockResolvedValue(mockInventory);

      const result = await resolver.inventory({ id: 'prod-1' } as any);

      expect(dataLoaders.inventoryLoader.load).toHaveBeenCalledWith('prod-1');
      expect(result).toEqual(mockInventory);
    });

    it('should return null when no inventory', async () => {
      (dataLoaders.inventoryLoader.load as jest.Mock).mockResolvedValue(null);

      const result = await resolver.inventory({ id: 'prod-1' } as any);
      expect(result).toBeNull();
    });
  });
});
