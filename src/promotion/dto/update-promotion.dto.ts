// dto/update-promotion.dto.ts
import { IsInt, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { CouponType } from '@prisma/client';

export class UpdatePromotionDto {
  @IsInt()
  productId: number;

  @IsEnum(CouponType)
  type: CouponType;

  @IsNumber()
  value: number;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;
}