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
import { CategoryRepository } from './category.repository';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let repo: jest.Mocked<CategoryRepository>;

  const now = new Date();
  const mockCategory = { id: 'cat-1', name: 'Electronics', createdAt: now, updatedAt: now };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: CategoryRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(CategoryService);
    repo = module.get(CategoryRepository) as jest.Mocked<CategoryRepository>;
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      repo.findAll.mockResolvedValue([mockCategory]);

      const result = await service.findAll();
      expect(result).toEqual([mockCategory]);
    });
  });

  describe('findById', () => {
    it('should return category when found', async () => {
      repo.findById.mockResolvedValue(mockCategory);

      const result = await service.findById('cat-1');
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a category', async () => {
      repo.findAll.mockResolvedValue([]);
      repo.create.mockResolvedValue(mockCategory);

      const result = await service.create({ name: 'Electronics' });

      expect(repo.create).toHaveBeenCalledWith({ name: 'Electronics' });
      expect(result).toEqual(mockCategory);
    });

    it('should throw ConflictException when name already exists (case insensitive)', async () => {
      repo.findAll.mockResolvedValue([mockCategory]);

      await expect(service.create({ name: 'electronics' })).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete and return true', async () => {
      repo.findById.mockResolvedValue(mockCategory);
      repo.delete.mockResolvedValue(mockCategory);

      const result = await service.delete('cat-1');
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.delete('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
