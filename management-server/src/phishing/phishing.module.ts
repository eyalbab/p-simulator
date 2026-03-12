import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PhishingController } from './phishing.controller';
import { PhishingAttempt, PhishingAttemptSchema } from './phishing-attempt.schema';
import { PhishingService } from './phishing.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PhishingAttempt.name, schema: PhishingAttemptSchema },
    ]),
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>(
          'SIMULATION_SERVER_URL',
          'http://localhost:3001',
        ),
      }),
    }),
  ],
  controllers: [PhishingController],
  providers: [PhishingService],
})
export class PhishingModule {}
