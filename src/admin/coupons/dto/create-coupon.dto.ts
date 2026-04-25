// src/admin/coupons/dto/create-coupon.dto.ts
import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsDateString, Min, Max, MinLength } from 'class-validator';
import { CouponType } from '@prisma/client';

export class CreateCouponDto {
  @IsString()
  @MinLength(3, { message: 'Le code doit contenir au moins 3 caractères' })
  code: string;

  @IsEnum(CouponType, { message: 'Type invalide. Doit être FIXED ou PERCENTAGE' })
  type: CouponType;

  @IsNumber()
  @Min(0, { message: 'La valeur doit être positive' })
  value: number;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Le nombre maximum d\'utilisations doit être au moins 1' })
  maxUses?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Format de date invalide. Utilisez ISO 8601' })
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}