import { IsEnum, IsString } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class WebhookDto {
  @IsString()
  reference: string;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;
}
