import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { UserRepository } from './user.repository';

const mockCache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

describe('UserRepository', () => {
  let repository: UserRepository;
  let prisma: {
    userProfile: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockProfile = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    avatarUrl: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(undefined);

    prisma = {
      userProfile: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        { provide: PrismaService, useValue: prisma },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    repository = module.get(UserRepository);
  });

  describe('findById', () => {
    it('should find a user profile by id', async () => {
      prisma.userProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await repository.findById('user-1');

      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(result).toEqual(mockProfile);
    });

    it('should return null if not found', async () => {
      prisma.userProfile.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a user profile by email', async () => {
      prisma.userProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await repository.findByEmail('test@example.com');

      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toEqual(mockProfile);
    });
  });

  describe('create', () => {
    it('should upsert a user profile', async () => {
      prisma.userProfile.upsert.mockResolvedValue(mockProfile);

      const result = await repository.create('user-1', 'test@example.com');

      expect(prisma.userProfile.upsert).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        create: { id: 'user-1', email: 'test@example.com' },
        update: {},
      });
      expect(result).toEqual(mockProfile);
    });
  });

  describe('update', () => {
    it('should update a user profile', async () => {
      const dto = { firstName: 'Jane' };
      const updatedProfile = { ...mockProfile, firstName: 'Jane' };
      prisma.userProfile.update.mockResolvedValue(updatedProfile);

      const result = await repository.update('user-1', dto);

      expect(prisma.userProfile.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: dto,
      });
      expect(result).toEqual(updatedProfile);
    });
  });
});
