import { Test, TestingModule } from '@nestjs/testing';
import { UserEventsController } from './user.events.controller';
import { UserService } from './user.service';

describe('UserEventsController', () => {
  let controller: UserEventsController;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserEventsController],
      providers: [
        {
          provide: UserService,
          useValue: {
            handleUserRegistered: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get(UserEventsController);
    userService = module.get(UserService);
  });

  describe('handleUserRegistered', () => {
    it('should call userService.handleUserRegistered with payload', async () => {
      const payload = {
        userId: 'user-1',
        email: 'test@example.com',
        registeredAt: '2026-01-01T00:00:00.000Z',
      };

      await controller.handleUserRegistered(payload);

      expect(userService.handleUserRegistered).toHaveBeenCalledWith(payload);
    });
  });
});
