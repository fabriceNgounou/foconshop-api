// src/orders/orders.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * GET /orders/me
   */
  @Get('me')
  getMyOrders(@Req() req: any) {
    return this.ordersService.findMyOrders(req.user.sub);
  }

  /**
   * GET /orders/:id
   */
  @Get(':id')
  getMyOrder(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.ordersService.findOneMyOrder(id, req.user.sub);
  }

  /**
   * PATCH /orders/:id/cancel
   */
  @Patch(':id/cancel')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.ordersService.cancel(id, req.user.sub);
  }

  /**
   * GET /orders/:id/status
   */
  @Get(':id/status')
  getStatus(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.getOrderStatus(+id, req.user.sub);
  }
}
