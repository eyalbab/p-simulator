import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreatePhishingAttemptDto {
  @IsEmail()
  @IsNotEmpty()
  recipientEmail: string;

  @IsString()
  @IsNotEmpty()
  emailContent: string;
}
