import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { AuthRepository } from './auth.repository';

jest.mock('../config', () => ({
  config: {
    DATABASE_URL: 'postgresql://localhost:5432/test',
  },
}));

const mockCache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

describe('AuthRepository', () => {
  let repository: AuthRepository;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    refreshToken: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashed-password',
    createdAt: new Date('2026-01-01'),
  };

  const mockRefreshToken = {
    id: 'token-1',
    token: 'token-hash',
    userId: 'user-1',
    isRevoked: false,
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(undefined);

    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRepository,
        { provide: PrismaService, useValue: prisma },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    repository = module.get(AuthRepository);
  });

  describe('findUserByEmail', () => {
    it('should find a user by email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findUserByEmail('test@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should find a user by id', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findUserById('user-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(result).toEqual(mockUser);
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await repository.createUser('test@example.com', 'hashed-password');

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'test@example.com', password: 'hashed-password' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('createRefreshToken', () => {
    it('should create a refresh token', async () => {
      const expiresAt = new Date(Date.now() + 86400000);
      prisma.refreshToken.create.mockResolvedValue(mockRefreshToken);

      const result = await repository.createRefreshToken('user-1', 'token-hash', expiresAt);

      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', token: 'token-hash', expiresAt },
      });
      expect(result).toEqual(mockRefreshToken);
    });
  });

  describe('findRefreshTokenByHash', () => {
    it('should find a refresh token with user included', async () => {
      const tokenWithUser = { ...mockRefreshToken, user: mockUser };
      prisma.refreshToken.findUnique.mockResolvedValue(tokenWithUser);

      const result = await repository.findRefreshTokenByHash('token-hash');

      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'token-hash' },
        include: { user: true },
      });
      expect(result).toEqual(tokenWithUser);
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke a refresh token by id', async () => {
      const revokedToken = { ...mockRefreshToken, isRevoked: true };
      prisma.refreshToken.update.mockResolvedValue(revokedToken);

      const result = await repository.revokeRefreshToken('token-1');

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-1' },
        data: { isRevoked: true },
      });
      expect(result).toEqual(revokedToken);
    });
  });

  describe('deleteExpiredTokensForUser', () => {
    it('should delete expired tokens for a user', () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      repository.deleteExpiredTokensForUser('user-1');

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', expiresAt: { lt: expect.any(Date) } },
      });
    });
  });
});
