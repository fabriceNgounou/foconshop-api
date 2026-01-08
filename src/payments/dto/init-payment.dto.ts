import { IsEnum, IsInt } from 'class-validator';
import { PaymentMethod, PaymentType } from '@prisma/client';

export class InitPaymentDto {
  @IsInt()
  orderId: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsEnum(PaymentType)
  type: PaymentType; // FULL ou DEPOSIT
}
