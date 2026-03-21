import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

jest.mock('../config', () => ({
  config: {
    PORT: 3002,
    NODE_ENV: 'test',
    SERVICE_NAME: 'user-service',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    CACHE_STORE: 'memory',
  },
}));

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UserService);
    userRepository = module.get(UserRepository);
  });

  describe('getProfile', () => {
    it('should return profile when found', async () => {
      userRepository.findById.mockResolvedValue(mockProfile);

      const result = await service.getProfile('user-1');

      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException when not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.getProfile('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update and return profile when found', async () => {
      const updateDto = { firstName: 'Jane' };
      const updatedProfile = { ...mockProfile, firstName: 'Jane' };
      userRepository.findById.mockResolvedValue(mockProfile);
      userRepository.update.mockResolvedValue(updatedProfile);

      const result = await service.updateProfile('user-1', updateDto);

      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(userRepository.update).toHaveBeenCalledWith('user-1', updateDto);
      expect(result).toEqual(updatedProfile);
    });

    it('should throw NotFoundException when not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.updateProfile('user-1', { firstName: 'Jane' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('handleUserRegistered', () => {
    it('should call repository.create with userId and email', async () => {
      const payload = {
        userId: 'user-1',
        email: 'test@example.com',
        registeredAt: '2026-01-01T00:00:00.000Z',
      };
      userRepository.create.mockResolvedValue(mockProfile);

      await service.handleUserRegistered(payload);

      expect(userRepository.create).toHaveBeenCalledWith('user-1', 'test@example.com');
    });
  });
});
