// src/orders/dto/create-address.dto.ts
import { IsString } from 'class-validator';

export class CreateGuestAddressDto {
  @IsString()
  fullName: string;

  @IsString()
  phone: string;

  @IsString()
  addressLine: string;

  @IsString()
  city: string;

  @IsString()
  country: string;
}
