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
import { CategoryResolver } from './category.resolver';
import { CategoryService } from './category.service';

describe('CategoryResolver', () => {
  let resolver: CategoryResolver;
  let service: jest.Mocked<CategoryService>;

  const now = new Date();
  const mockCategory = { id: 'cat-1', name: 'Electronics', createdAt: now, updatedAt: now };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryResolver,
        {
          provide: CategoryService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get(CategoryResolver);
    service = module.get(CategoryService) as jest.Mocked<CategoryService>;
  });

  describe('categories query', () => {
    it('should return all categories', async () => {
      service.findAll.mockResolvedValue([mockCategory]);

      const result = await resolver.categories();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockCategory]);
    });
  });

  describe('category query', () => {
    it('should return a category by id', async () => {
      service.findById.mockResolvedValue(mockCategory);

      const result = await resolver.category('cat-1');

      expect(service.findById).toHaveBeenCalledWith('cat-1');
      expect(result).toEqual(mockCategory);
    });
  });

  describe('createCategory mutation', () => {
    it('should create and return a category', async () => {
      service.create.mockResolvedValue(mockCategory);

      const result = await resolver.createCategory({ name: 'Electronics' });

      expect(service.create).toHaveBeenCalledWith({ name: 'Electronics' });
      expect(result).toEqual(mockCategory);
    });
  });

  describe('deleteCategory mutation', () => {
    it('should delete and return true', async () => {
      service.delete.mockResolvedValue(true);

      const result = await resolver.deleteCategory('cat-1');

      expect(service.delete).toHaveBeenCalledWith('cat-1');
      expect(result).toBe(true);
    });
  });
});
