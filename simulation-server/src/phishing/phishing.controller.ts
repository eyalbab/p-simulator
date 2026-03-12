import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiKeyGuard } from './guards/api-key.guard';
import { PhishingService } from './phishing.service';
import { SendPhishingDto } from './send-phishing.dto';

@Controller('phishing')
export class PhishingController {
  constructor(private readonly phishingService: PhishingService) {}

  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ApiKeyGuard)
  async sendPhishingEmail(@Body() dto: SendPhishingDto) {
    const attempt = await this.phishingService.sendPhishingEmail(dto);
    return {
      id: attempt._id,
      trackingId: attempt.trackingId,
      recipientEmail: attempt.recipientEmail,
      status: attempt.status,
      sentAt: attempt.sentAt,
    };
  }

  @Get('track/:trackingId')
  async trackClick(@Param('trackingId') trackingId: string, @Res() res: Response) {
    await this.phishingService.trackClick(trackingId);
    return res.status(HttpStatus.OK).send(this.buildAwarenessPage());
  }

  private buildAwarenessPage(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Phishing Simulation Alert</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #f0f4f8; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #fff; border-radius: 8px; box-shadow: 0 2px 16px rgba(0,0,0,0.12); max-width: 560px; width: 100%; padding: 40px; text-align: center; }
    .icon { font-size: 64px; margin-bottom: 16px; }
    h1 { color: #d93025; font-size: 24px; margin-bottom: 16px; }
    p { color: #555; line-height: 1.7; margin-bottom: 12px; }
    .highlight { background: #fff8e1; border-left: 4px solid #f9a825; padding: 12px 16px; border-radius: 4px; text-align: left; margin: 20px 0; }
    .highlight strong { color: #333; }
    ul { text-align: left; padding-left: 20px; color: #555; }
    ul li { margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>This Was a Phishing Simulation Test</h1>
    <p>You clicked a link in a simulated phishing email. This was a security awareness exercise — no harm has been done.</p>
    <div class="highlight">
      <strong>Why this matters:</strong>
      <ul style="margin-top: 8px;">
        <li>Phishing emails are the #1 entry point for cyberattacks.</li>
        <li>Always verify the sender before clicking links.</li>
        <li>When in doubt, report suspicious emails to IT security.</li>
      </ul>
    </div>
    <p>Your click has been recorded as part of this security awareness campaign. Thank you for participating.</p>
  </div>
</body>
</html>
    `.trim();
  }
}
