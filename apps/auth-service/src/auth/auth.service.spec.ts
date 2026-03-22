import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

jest.mock('../config', () => ({
  config: {
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

const MOCK_UUID = 'mock-uuid-1234';
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: () => MOCK_UUID,
}));

 
const bcrypt = require('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let queueClient: { emit: jest.Mock };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashed-password',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findUserByEmail: jest.fn(),
            findUserById: jest.fn(),
            createUser: jest.fn(),
            createRefreshToken: jest.fn(),
            findRefreshTokenByHash: jest.fn(),
            revokeRefreshToken: jest.fn(),
            deleteExpiredTokensForUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-access-token'),
          },
        },
        {
          provide: 'QUEUE_CLIENT',
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    authRepository = module.get(AuthRepository);
    queueClient = module.get('QUEUE_CLIENT');
  });

  describe('register', () => {
    it('should create user, emit event, and return tokens', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.createUser.mockResolvedValue(mockUser);
      authRepository.createRefreshToken.mockResolvedValue({} as unknown);

      const result = await service.register('test@example.com', 'password123');

      expect(authRepository.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(authRepository.createUser).toHaveBeenCalledWith('test@example.com', 'hashed-password');
      expect(queueClient.emit).toHaveBeenCalledWith('user.registered', {
        userId: mockUser.id,
        email: mockUser.email,
        registeredAt: mockUser.createdAt.toISOString(),
      });
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: MOCK_UUID,
        expiresIn: expect.any(Number),
      });
    });

    it('should throw ConflictException if email already registered', async () => {
      authRepository.findUserByEmail.mockResolvedValue(mockUser);

      await expect(service.register('test@example.com', 'password123')).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should verify password and return tokens on success', async () => {
      authRepository.findUserByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      authRepository.createRefreshToken.mockResolvedValue({} as unknown);

      const result = await service.login('test@example.com', 'password123');

      expect(authRepository.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: MOCK_UUID,
        expiresIn: expect.any(Number),
      });
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      authRepository.findUserByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(service.login('test@example.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for nonexistent email', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      await expect(service.login('nonexistent@example.com', 'password')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    const mockStoredToken = {
      id: 'token-1',
      token: 'hashed-token',
      userId: 'user-1',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      user: mockUser,
    };

    it('should revoke old token and issue new pair on success', async () => {
      authRepository.findRefreshTokenByHash.mockResolvedValue(mockStoredToken);
      authRepository.revokeRefreshToken.mockResolvedValue({} as unknown);
      authRepository.createRefreshToken.mockResolvedValue({} as unknown);

      const result = await service.refresh('some-refresh-token');

      expect(authRepository.findRefreshTokenByHash).toHaveBeenCalled();
      expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith('token-1');
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: MOCK_UUID,
        expiresIn: expect.any(Number),
      });
    });

    it('should throw UnauthorizedException for expired token', async () => {
      authRepository.findRefreshTokenByHash.mockResolvedValue({
        ...mockStoredToken,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.refresh('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for revoked token', async () => {
      authRepository.findRefreshTokenByHash.mockResolvedValue({
        ...mockStoredToken,
        isRevoked: true,
      });

      await expect(service.refresh('revoked-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token on success', async () => {
      const storedToken = {
        id: 'token-1',
        token: 'hashed',
        userId: 'user-1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        user: mockUser,
      };
      authRepository.findRefreshTokenByHash.mockResolvedValue(storedToken);
      authRepository.revokeRefreshToken.mockResolvedValue({} as unknown);

      await service.logout('some-token');

      expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith('token-1');
    });

    it('should do nothing if token does not exist', async () => {
      authRepository.findRefreshTokenByHash.mockResolvedValue(null);

      await expect(service.logout('nonexistent-token')).resolves.toBeUndefined();
      expect(authRepository.revokeRefreshToken).not.toHaveBeenCalled();
    });
  });
});
