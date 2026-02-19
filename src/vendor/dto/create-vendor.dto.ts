// src/vendor/dto/create-vendor.dto.ts
import {
  IsString,
  IsOptional,
  IsInt,
  MinLength,
} from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @MinLength(2)
  businessName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  categoryId: number;

  @IsString()
  phone: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  region: string;
}
