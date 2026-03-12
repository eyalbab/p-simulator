import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { isAxiosError } from 'axios';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { CreatePhishingAttemptDto } from './dto/create-phishing-attempt.dto';
import { PhishingAttempt, PhishingAttemptDocument } from './phishing-attempt.schema';

@Injectable()
export class PhishingService {
  constructor(
    @InjectModel(PhishingAttempt.name)
    private readonly phishingAttemptModel: Model<PhishingAttemptDocument>,
    private readonly httpService: HttpService,
  ) {}

  async getAllAttempts(): Promise<PhishingAttemptDocument[]> {
    return this.phishingAttemptModel.find().sort({ createdAt: -1 }).exec();
  }

  async createAttempt(dto: CreatePhishingAttemptDto, sentBy: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/phishing/send', {
          recipientEmail: dto.recipientEmail,
          emailContent: dto.emailContent,
          sentBy,
        }),
      );

      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const upstreamStatus = error.response?.status;

        if (upstreamStatus) {
          throw new BadGatewayException(
            `Simulation server failed to create phishing attempt (status ${upstreamStatus})`,
          );
        }

        throw new ServiceUnavailableException(
          'Simulation server is unavailable. Please try again later.',
        );
      }

      throw new InternalServerErrorException('Failed to create phishing attempt');
    }
  }
}
