import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendPhishingDto {
  @IsEmail()
  @IsNotEmpty()
  recipientEmail: string;

  @IsString()
  @IsNotEmpty()
  emailContent: string;

  @IsString()
  @IsNotEmpty()
  sentBy: string;
}
