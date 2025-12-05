import {
  Controller,
  Post,
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
import type { Request } from 'express'; 
import { UpdateVendorStatusDto } from './dto/update-vendor-status.dto';

@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post(':id/kyc')
  @Roles(Role.VENDOR)
  async uploadKyc(
    @Param('id') id: string,
    @Body() dto: CreateKycDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (Number(user.vendorId) !== Number(id)) {
      throw new ForbiddenException(
        'You can only upload your own KYC documents',
      );
    }

    return await this.vendorService.addKycDocument(Number(id), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN) // uniquement l'Admin !
@Patch(':id/status')
async updateVendorStatus(
  @Param('id') id: string,
  @Body() dto: UpdateVendorStatusDto,
) {
  return await this.vendorService.updateStatus(Number(id), dto.status);
}
}
