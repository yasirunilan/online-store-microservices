import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

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
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            getProfile: jest.fn().mockResolvedValue(mockProfile),
            updateProfile: jest.fn().mockResolvedValue(mockProfile),
          },
        },
      ],
    }).compile();

    controller = module.get(UserController);
    userService = module.get(UserService);
  });

  describe('getMe', () => {
    it('should extract userId from req.user and call userService.getProfile', async () => {
      const req = { user: { userId: 'user-1', email: 'test@example.com' } };

      const result = await controller.getMe(req);

      expect(userService.getProfile).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateMe', () => {
    it('should extract userId from req.user and call userService.updateProfile with dto', async () => {
      const req = { user: { userId: 'user-1', email: 'test@example.com' } };
      const dto = { firstName: 'Jane' };
      const updatedProfile = { ...mockProfile, firstName: 'Jane' };
      userService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateMe(req, dto);

      expect(userService.updateProfile).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(updatedProfile);
    });
  });
});
