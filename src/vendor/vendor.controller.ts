// src/vendor/vendor.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Patch,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { VendorService } from './vendor.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateVendorStatusDto } from './dto/update-vendor-status.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';

@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorController {
  constructor(private readonly vendorService: VendorService) { }

  /**
   * CLIENT → demander à devenir vendeur
   */
  @Post()
  @Roles(Role.CLIENT)
  becomeVendor(@Req() req: any, @Body() dto: CreateVendorDto,) {
    return this.vendorService.createVendorProfile(req.user.sub, dto);
  }

  /**
   * VENDOR → voir son profil
   */
  // @Get('me')
  // @Roles(Role.VENDOR)
  // getMyProfile(@Req() req: any) {
  //   return this.vendorService.getByUserId(req.user.sub);
  // }

  /**
   * VENDOR → ajouter KYC (route sécurisée)
   */
  @Post('me/kyc')
  @Roles(Role.VENDOR)
  uploadMyKyc(@Req() req: any, @Body() dto: CreateKycDto) {
    return this.vendorService.addKycDocument(req.user.vendorId, dto);
  }

  /**
   * ADMIN → valider / rejeter vendeur
   */
  @Patch(':id/status')
  @Roles(Role.ADMIN)
  updateVendorStatus(
    @Param('id') id: string,
    @Body() dto: UpdateVendorStatusDto,
  ) {
    return this.vendorService.updateStatus(Number(id), dto.status);
  }

  /**
   * ADMIN → vendeurs en attente
   */
  @Get('pending')
  @Roles(Role.ADMIN)
  getPendingVendors() {
    return this.vendorService.getPendingVendors();
  }

  /**
   * VENDOR → Récupérer les commandes d'un vendeur
   */
  @Get('orders')
  getMyOrders(@Req() req: any) {
    return this.vendorService.findOrdersForVendor(req.user.sub);
  }

  /**
   * VENDOR → voir son profil
   */

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyVendorProfile(@Req() req: any) {
    return this.vendorService.getMyVendorProfile(req.user.sub);
  }

  /**
   * 🔓 PUBLIC – Récupérer un vendeur par ID
   * GET /vendors/:id
   * Doit être placé après toutes les routes spécifiques (pending, orders, me)
   */
  @Get(':id')
  getVendorById(@Param('id') id: string) {
    return this.vendorService.getVendorById(Number(id));
  }
}
