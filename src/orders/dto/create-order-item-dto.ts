// src/orders/dto/create-order.dto.ts
import {
  IsInt,
  IsPositive,
  IsString,
  IsOptional,
  IsArray,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGuestAddressDto } from './create-address.dto';

export class CreateOrderItemDto {
  @IsInt()
  variantId: number;

  @IsInt()
  @IsPositive()
  quantity: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @ValidateNested()
  @Type(() => CreateGuestAddressDto)
  address: CreateGuestAddressDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
