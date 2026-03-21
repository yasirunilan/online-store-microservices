import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedMiddlewareModule } from '@online-store/shared-middleware';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { NotificationEventsController } from './notification.events.controller';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { NotificationEmailService } from './notification.email.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
    SharedMiddlewareModule,
  ],
  controllers: [NotificationEventsController],
  providers: [NotificationService, NotificationRepository, NotificationEmailService],
})
export class NotificationModule {}
