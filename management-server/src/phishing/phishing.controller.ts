import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePhishingAttemptDto } from './dto/create-phishing-attempt.dto';
import { PhishingService } from './phishing.service';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email: string;
    name: string;
  };
};

@Controller('phishing')
@UseGuards(JwtAuthGuard)
export class PhishingController {
  constructor(private readonly phishingService: PhishingService) {}

  @Get('attempts')
  @HttpCode(HttpStatus.OK)
  getAttempts() {
    return this.phishingService.getAllAttempts();
  }

  @Post('attempts')
  @HttpCode(HttpStatus.CREATED)
  createAttempt(
    @Body() dto: CreatePhishingAttemptDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.phishingService.createAttempt(dto, request.user.id);
  }
}
