// src/vendor/dto/create-vendor.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class CreateVendorDto {
  @IsOptional()
  @IsString()
  // Par exemple nom de la boutique
  storeName?: string;
}
