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
  @IsOptional()
  @IsString()
  phone: string;
  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  city: string;
  
  @IsOptional()
  @IsString()
  region: string;
}
