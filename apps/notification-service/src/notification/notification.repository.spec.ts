jest.mock('../config', () => ({
  config: {
    PORT: 3005,
    NODE_ENV: 'test',
    SERVICE_NAME: 'notification-service',
    LOG_LEVEL: 'warn',
    MONGODB_URI: 'mongodb://localhost:27017/test',
    QUEUE_TRANSPORT: 'rabbitmq',
    RABBITMQ_URL: 'amqp://localhost:5672',
    MAIL_HOST: 'localhost',
    MAIL_PORT: 1025,
    MAIL_FROM: 'test@test.com',
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationRepository } from './notification.repository';
import { Notification } from './schemas/notification.schema';

const mockExec = jest.fn();
const mockModel = {
  create: jest.fn(),
  find: jest.fn().mockReturnValue({ exec: mockExec }),
};

describe('NotificationRepository', () => {
  let repository: NotificationRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationRepository,
        { provide: getModelToken(Notification.name), useValue: mockModel },
      ],
    }).compile();

    repository = module.get<NotificationRepository>(NotificationRepository);
    jest.clearAllMocks();
    mockModel.find.mockReturnValue({ exec: mockExec });
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const data = {
        type: 'welcome_email',
        recipientEmail: 'test@example.com',
        recipientUserId: 'user-uuid',
        payload: { userId: 'user-uuid' },
        status: 'sent',
      };
      const created = { ...data, _id: 'notif-id' };
      mockModel.create.mockResolvedValue(created);

      const result = await repository.create(data);

      expect(mockModel.create).toHaveBeenCalledWith(data);
      expect(result).toBe(created);
    });
  });

  describe('findByUserId', () => {
    it('should find notifications by userId', async () => {
      const notifications = [{ type: 'welcome_email', recipientUserId: 'user-uuid' }];
      mockExec.mockResolvedValue(notifications);

      const result = await repository.findByUserId('user-uuid');

      expect(mockModel.find).toHaveBeenCalledWith({ recipientUserId: 'user-uuid' });
      expect(result).toBe(notifications);
    });
  });

  describe('findAll', () => {
    it('should find all notifications', async () => {
      const notifications = [{ type: 'welcome_email' }];
      mockExec.mockResolvedValue(notifications);

      const result = await repository.findAll();

      expect(mockModel.find).toHaveBeenCalledWith();
      expect(result).toBe(notifications);
    });
  });
});
