// src/admin/vendors/admin-vendors.controller.ts
import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { AdminVendorsService } from './admin-vendor.service';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('admin/vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminVendorsController {
  constructor(private readonly adminVendorsService: AdminVendorsService) {}

  @Get()
  findAll() {
    return this.adminVendorsService.findAllVendors();
  }

  @Get(':vendorId/kyc-documents')
getVendorKycDocuments(@Param('vendorId') vendorId: string) {
  return this.adminVendorsService.getVendorKycDocuments(Number(vendorId));
}
}
