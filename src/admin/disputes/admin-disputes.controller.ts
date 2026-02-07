import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminDisputesService } from './admin-disputes.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { DisputeStatus } from '@prisma/client';

@Controller('admin/disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminDisputesController {
  constructor(private readonly adminDisputesService: AdminDisputesService) {}

  @Get()
  findAll() {
    return this.adminDisputesService.findAllDisputes();
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: DisputeStatus,
  ) {
    return this.adminDisputesService.updateDisputeStatus(id, status);
  }
}
