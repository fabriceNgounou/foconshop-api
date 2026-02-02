import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ResolutionType } from '@prisma/client';

export class CreateResolutionDto {
  @IsInt()
  disputeId: number;

  @IsEnum(ResolutionType)
  type: ResolutionType;

  @IsOptional()
  @IsString()
  note?: string;
}
