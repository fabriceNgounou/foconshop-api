// src/address/address.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  /**
   * POST /addresses
   * Créer une adresse
   */
  @Post()
  create(@Req() req: any, @Body() dto: CreateAddressDto) {
    const userId = req.user.sub;
    return this.addressService.create(userId, dto);
  }

  /**
   * GET /addresses/me
   * Lister ses adresses
   */
  @Get('me')
  findMyAddresses(@Req() req: any) {
    const userId = req.user.sub;
    return this.addressService.findMyAddresses(userId);
  }
}
