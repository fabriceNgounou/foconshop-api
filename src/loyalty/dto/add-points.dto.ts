import { IsInt, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { LoyaltySource } from '@prisma/client';

export class AddPointsDto {
  @IsInt()
  @Min(1)
  points: number;

  @IsEnum(LoyaltySource)
  source: LoyaltySource;

  @IsOptional()
  @IsString()
  reference?: string;
}
