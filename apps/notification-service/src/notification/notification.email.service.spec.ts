jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
}));

jest.mock('../config', () => ({
  config: {
    MAIL_HOST: 'localhost',
    MAIL_PORT: 1025,
    MAIL_FROM: 'test@test.com',
  },
}));

import * as nodemailer from 'nodemailer';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationEmailService } from './notification.email.service';

describe('NotificationEmailService', () => {
  let service: NotificationEmailService;
  let mockSendMail: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationEmailService],
    }).compile();

    service = module.get<NotificationEmailService>(NotificationEmailService);

    mockSendMail = (nodemailer.createTransport as jest.Mock)().sendMail;
    jest.clearAllMocks();
  });

  describe('sendWelcomeEmail', () => {
    it('should create transporter and send welcome email with correct params', async () => {
      await service.sendWelcomeEmail('user@example.com', 'user-uuid');

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'localhost',
        port: 1025,
        secure: false,
      });
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'test@test.com',
        to: 'user@example.com',
        subject: 'Welcome to Online Store!',
        html: expect.stringContaining('user-uuid'),
      });
    });
  });

  describe('sendOrderConfirmationEmail', () => {
    it('should send email with order details', async () => {
      const payload = {
        orderId: 'order-uuid',
        totalAmount: 29.99,
        items: [{ productName: 'Widget', quantity: 1, price: 29.99 }],
      };

      await service.sendOrderConfirmationEmail('user@example.com', payload);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'test@test.com',
        to: 'user@example.com',
        subject: 'Order Confirmation — #order-uuid',
        html: expect.stringContaining('Widget'),
      });
    });
  });

  describe('sendOrderStatusUpdateEmail', () => {
    it('should send email with status change info', async () => {
      const payload = {
        orderId: 'order-uuid',
        previousStatus: 'PENDING',
        newStatus: 'CONFIRMED',
      };

      await service.sendOrderStatusUpdateEmail('user@example.com', payload);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'test@test.com',
        to: 'user@example.com',
        subject: 'Order #order-uuid — Status Update',
        html: expect.stringContaining('CONFIRMED'),
      });
    });
  });
});
