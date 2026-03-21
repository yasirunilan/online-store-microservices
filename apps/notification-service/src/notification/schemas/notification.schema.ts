import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  type!: string; // 'welcome_email' | 'order_confirmation' | 'order_status_update'

  @Prop({ required: true })
  recipientEmail!: string;

  @Prop({ required: true })
  recipientUserId!: string;

  @Prop({ type: Object })
  payload!: Record<string, unknown>;

  @Prop({ default: 'sent' })
  status!: string; // 'sent' | 'failed'

  @Prop()
  errorMessage?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
