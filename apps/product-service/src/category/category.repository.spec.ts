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
import { CategoryRepository } from './category.repository';

const mockCache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

describe('CategoryRepository', () => {
  let repository: CategoryRepository;
  let prisma: PrismaService;

  const now = new Date();
  const mockCategory = { id: 'cat-1', name: 'Electronics', createdAt: now, updatedAt: now };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryRepository,
        {
          provide: PrismaService,
          useValue: {
            category: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    repository = module.get(CategoryRepository);
    prisma = module.get(PrismaService);
  });

  describe('findAll', () => {
    it('should return all categories ordered by name', async () => {
      (prisma.category.findMany as jest.Mock).mockResolvedValue([mockCategory]);

      const result = await repository.findAll();

      expect(prisma.category.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
      expect(result).toEqual([mockCategory]);
    });
  });

  describe('findById', () => {
    it('should return category by id', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);

      const result = await repository.findById('cat-1');

      expect(prisma.category.findUnique).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
      expect(result).toEqual(mockCategory);
    });

    it('should return null when not found', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('missing');
      expect(result).toBeNull();
    });
  });

  describe('findByIds', () => {
    it('should return categories matching ids', async () => {
      const categories = [mockCategory, { ...mockCategory, id: 'cat-2', name: 'Books' }];
      (prisma.category.findMany as jest.Mock).mockResolvedValue(categories);

      const result = await repository.findByIds(['cat-1', 'cat-2']);

      expect(prisma.category.findMany).toHaveBeenCalledWith({ where: { id: { in: ['cat-1', 'cat-2'] } } });
      expect(result).toEqual(categories);
    });
  });

  describe('create', () => {
    it('should create a category', async () => {
      const input = { name: 'Electronics' };
      (prisma.category.create as jest.Mock).mockResolvedValue(mockCategory);

      const result = await repository.create(input);

      expect(prisma.category.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(mockCategory);
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      (prisma.category.delete as jest.Mock).mockResolvedValue(mockCategory);

      const result = await repository.delete('cat-1');

      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
      expect(result).toEqual(mockCategory);
    });
  });
});
