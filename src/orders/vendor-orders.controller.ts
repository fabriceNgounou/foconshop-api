// src/orders/vendor-orders.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('vendor/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VENDOR')
export class VendorOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  getVendorOrders(@Req() req: any) {
    return this.ordersService.findOrdersForVendor(req.user.sub);
  }
}
