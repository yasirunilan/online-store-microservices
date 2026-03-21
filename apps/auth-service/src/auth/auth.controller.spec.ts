import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

jest.mock('../config', () => ({
  config: {
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
  },
}));

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthResponse = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 900,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn().mockResolvedValue(mockAuthResponse),
            login: jest.fn().mockResolvedValue(mockAuthResponse),
            refresh: jest.fn().mockResolvedValue(mockAuthResponse),
            logout: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  describe('register', () => {
    it('should call authService.register with email and password', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto.email, dto.password);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('login', () => {
    it('should call authService.login with email and password', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto.email, dto.password);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh with refreshToken', async () => {
      const dto = { refreshToken: 'some-refresh-token' };

      const result = await controller.refresh(dto);

      expect(authService.refresh).toHaveBeenCalledWith(dto.refreshToken);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with refreshToken', async () => {
      const dto = { refreshToken: 'some-refresh-token' };

      await controller.logout(dto);

      expect(authService.logout).toHaveBeenCalledWith(dto.refreshToken);
    });
  });
});
