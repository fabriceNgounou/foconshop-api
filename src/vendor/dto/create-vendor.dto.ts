// src/vendor/dto/create-vendor.dto.ts
import {
  IsString,
  IsInt,
  MinLength,
} from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @MinLength(3)
  businessName: string;

  
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
