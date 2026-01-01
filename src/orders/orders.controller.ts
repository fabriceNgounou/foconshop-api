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
    const userId = req.user.sub;
    return this.ordersService.findMyOrders(userId);
  }

  /**
   * GET /orders/:id
   */
  @Get(':id')
  getMyOrder(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    return this.ordersService.findOneMyOrder(id, userId);
  }

  @Patch(':id/pay')
  pay(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.ordersService.markAsPaid(id, req.user.sub);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.ordersService.cancel(id, req.user.sub);
  }


}
