import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /* ===========================
     LIST ADMINS
     =========================== */
  @Get('users/admins')
  async listAdmins() {
    return this.adminService.listAdmins();
  }

  /* ===========================
     PROMOTE USER
     =========================== */
  @Patch('users/:id/make-admin')
  async makeAdmin(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.makeAdmin(id);
  }

  /* ===========================
     REMOVE ADMIN ROLE
     =========================== */
  @Patch('users/:id/remove-admin')
  async removeAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.adminService.removeAdmin(
      id,
      req.user.id, // admin connecté
    );
  }
}