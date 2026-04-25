// src/vendor/vendor-contoller.controller.ts
import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { VendorService } from './vendor.service';


@Controller('vendors')
export class VendorPublicController {
  constructor(private readonly vendorService: VendorService) {}


// public
  @Get('infos/:id')
  getVendorProfile(@Param('id') id: string) {
    return this.vendorService.getVendorProfile(Number(id));
  }


}
