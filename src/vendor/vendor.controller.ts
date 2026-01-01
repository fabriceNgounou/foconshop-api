// src/vendor/vendor.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';
import { VendorService } from './vendor.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateVendorStatusDto } from './dto/update-vendor-status.dto';

@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  /**
   * 1️⃣ Devenir vendeur
   * POST /vendors
   * Rôle : CLIENT
   */
  @Post()
  @Roles(Role.CLIENT)
  async becomeVendor(@Req() req: any) {
    const userId = req.user.sub;
    return this.vendorService.createVendorProfile(userId);
  }

  /**
   * 2️⃣ Consulter son profil vendeur
   * GET /vendors/me
   * Rôle : VENDOR
   */
  @Get('me')
  @Roles(Role.VENDOR)
  async getMyVendorProfile(@Req() req: any) {
    return this.vendorService.getByUserId(req.user.sub);
  }

  /**
   * 3️⃣ Ajouter un KYC
   * POST /vendors/:id/kyc
   * Rôle : VENDOR
   */
  @Post(':id/kyc')
  @Roles(Role.VENDOR)
  async uploadKyc(
    @Param('id') id: string,
    @Body() dto: CreateKycDto,
    @Req() req: any,
  ) {
    if (Number(req.user.vendorId) !== Number(id)) {
      throw new ForbiddenException(
        'You can only upload your own KYC documents',
      );
    }

    return this.vendorService.addKycDocument(Number(id), dto);
  }

  /**
   * 4️⃣ Validation / rejet vendeur
   * PATCH /vendors/:id/status
   * Rôle : ADMIN
   */
  @Patch(':id/status')
  @Roles(Role.ADMIN)
  async updateVendorStatus(
    @Param('id') id: string,
    @Body() dto: UpdateVendorStatusDto,
  ) {
    return this.vendorService.updateStatus(Number(id), dto.status);
  }
}
