import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PhishingAttemptDocument = PhishingAttempt & Document;

@Schema({ timestamps: true })
export class PhishingAttempt {
  @Prop({ required: true })
  recipientEmail: string;

  @Prop({ required: true })
  emailContent: string;

  @Prop({ required: true, enum: ['sent', 'clicked', 'failed'], default: 'sent' })
  status: 'sent' | 'clicked' | 'failed';

  @Prop({ required: true, unique: true })
  trackingId: string;

  @Prop({ type: Types.ObjectId, required: true })
  sentBy: Types.ObjectId;

  @Prop()
  sentAt: Date;

  @Prop()
  clickedAt?: Date;
}

export const PhishingAttemptSchema = SchemaFactory.createForClass(PhishingAttempt);
