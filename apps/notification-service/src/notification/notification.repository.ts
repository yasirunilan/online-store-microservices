import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(data: Partial<Notification>): Promise<NotificationDocument> {
    return this.notificationModel.create(data);
  }

  async findByUserId(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel.find({ recipientUserId: userId }).exec();
  }

  async findAll(): Promise<NotificationDocument[]> {
    return this.notificationModel.find().exec();
  }
}
