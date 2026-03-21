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
import { InventoryRepository } from './inventory.repository';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let repo: jest.Mocked<InventoryRepository>;

  const now = new Date();
  const mockInventory = { id: 'inv-1', productId: 'prod-1', quantity: 10, reservedQuantity: 0, updatedAt: now };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: InventoryRepository,
          useValue: {
            upsert: jest.fn(),
            findByProductId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(InventoryService);
    repo = module.get(InventoryRepository) as jest.Mocked<InventoryRepository>;
  });

  describe('updateStock', () => {
    it('should upsert inventory via repository', async () => {
      repo.upsert.mockResolvedValue(mockInventory);

      const result = await service.updateStock({ productId: 'prod-1', quantity: 10 });

      expect(repo.upsert).toHaveBeenCalledWith('prod-1', 10);
      expect(result).toEqual(mockInventory);
    });
  });

  describe('findByProductId', () => {
    it('should return inventory when found', async () => {
      repo.findByProductId.mockResolvedValue(mockInventory);

      const result = await service.findByProductId('prod-1');
      expect(result).toEqual(mockInventory);
    });

    it('should return null when not found', async () => {
      repo.findByProductId.mockResolvedValue(null);

      const result = await service.findByProductId('missing');
      expect(result).toBeNull();
    });
  });
});
