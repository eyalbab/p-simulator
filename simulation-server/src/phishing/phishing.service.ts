import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { PhishingAttempt, PhishingAttemptDocument } from './phishing-attempt.schema';
import { SendPhishingDto } from './send-phishing.dto';

@Injectable()
export class PhishingService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(PhishingAttempt.name)
    private readonly phishingAttemptModel: Model<PhishingAttemptDocument>,
    private readonly configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendPhishingEmail(dto: SendPhishingDto): Promise<PhishingAttemptDocument> {
    const trackingId = uuidv4();
    const trackingBaseUrl = this.configService.get<string>('TRACKING_BASE_URL', 'http://localhost:3001');
    const trackingUrl = `${trackingBaseUrl}/phishing/track/${trackingId}`;

    const attempt = await this.phishingAttemptModel.create({
      recipientEmail: dto.recipientEmail,
      emailContent: dto.emailContent,
      status: 'pending',
      trackingId,
      sentBy: new Types.ObjectId(dto.sentBy),
    });

    const emailHtml = this.buildEmailHtml(dto.emailContent, trackingUrl);

    await this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_USER'),
      to: dto.recipientEmail,
      subject: 'Important: Action Required',
      html: emailHtml,
    });

    attempt.status = 'sent';
    attempt.sentAt = new Date();
    await attempt.save();

    return attempt;
  }

  async trackClick(trackingId: string): Promise<PhishingAttemptDocument> {
    const attempt = await this.phishingAttemptModel.findOne({ trackingId });

    if (!attempt) {
      throw new NotFoundException(`Tracking ID not found`);
    }

    if (attempt.status !== 'clicked') {
      attempt.status = 'clicked';
      attempt.clickedAt = new Date();
      await attempt.save();
    }

    return attempt;
  }

  private buildEmailHtml(content: string, trackingUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0; }
    .cta { display: inline-block; background: #0078d4; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
    .footer { font-size: 12px; color: #888; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="content">
    <p>${content}</p>
    <p style="margin-top: 24px;">
      <a class="cta" href="${trackingUrl}">Click Here to Proceed</a>
    </p>
  </div>
  <div class="footer">
    <p>Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim();
  }
}
