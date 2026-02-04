// src/orders/orders.controller.ts
import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Req,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order-item-dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ===== CLIENT =====

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyOrders(@Req() req: any) {
    return this.ordersService.findMyOrders(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getMyOrder(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.ordersService.findOneMyOrder(id, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.ordersService.cancel(id, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/status')
  getStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.ordersService.getOrderStatus(id, req.user.sub);
  }

  // ===== GUEST =====

  @Post('guest')
  createGuestOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createGuestOrder(dto);
  }
}
