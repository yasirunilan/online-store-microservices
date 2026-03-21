import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { config } from '../config';

@Injectable()
export class NotificationEmailService {
  private readonly logger = new Logger(NotificationEmailService.name);

  private createTransporter() {
    return nodemailer.createTransport({
      host: config.MAIL_HOST,
      port: config.MAIL_PORT,
      secure: false,
    });
  }

  async sendWelcomeEmail(email: string, userId: string): Promise<void> {
    const transporter = this.createTransporter();
    await transporter.sendMail({
      from: config.MAIL_FROM,
      to: email,
      subject: 'Welcome to Online Store!',
      html: `<h1>Welcome!</h1><p>Thank you for registering with Online Store. Your account (ID: ${userId}) is ready to use.</p>`,
    });
    this.logger.log(`Welcome email sent to ${email}`);
  }

  async sendOrderConfirmationEmail(
    email: string,
    payload: { orderId: string; totalAmount: number; items: Array<{ productName: string; quantity: number; price: number }> },
  ): Promise<void> {
    const itemsList = payload.items
      .map((item) => `<li>${item.productName} x${item.quantity} — $${item.price.toFixed(2)}</li>`)
      .join('');

    const transporter = this.createTransporter();
    await transporter.sendMail({
      from: config.MAIL_FROM,
      to: email,
      subject: `Order Confirmation — #${payload.orderId}`,
      html: `<h1>Order Confirmed</h1><p>Your order <strong>#${payload.orderId}</strong> has been placed.</p><ul>${itemsList}</ul><p><strong>Total: $${payload.totalAmount.toFixed(2)}</strong></p>`,
    });
    this.logger.log(`Order confirmation email sent to ${email} for order ${payload.orderId}`);
  }

  async sendOrderStatusUpdateEmail(
    email: string,
    payload: { orderId: string; previousStatus: string; newStatus: string },
  ): Promise<void> {
    const transporter = this.createTransporter();
    await transporter.sendMail({
      from: config.MAIL_FROM,
      to: email,
      subject: `Order #${payload.orderId} — Status Update`,
      html: `<h1>Order Status Updated</h1><p>Your order <strong>#${payload.orderId}</strong> status has changed from <em>${payload.previousStatus}</em> to <strong>${payload.newStatus}</strong>.</p>`,
    });
    this.logger.log(`Order status update email sent to ${email} for order ${payload.orderId}`);
  }
}
