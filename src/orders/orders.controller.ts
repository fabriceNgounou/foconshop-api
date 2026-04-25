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
import { OrderStatus } from '@prisma/client';

class UpdateOrderStatusDto {
  status!: OrderStatus;
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /* ========================= CLIENT ========================= */

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

  // ✅ ANNULATION CLIENT (propre)
  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.ordersService.cancelOrderByClient(
      id,
      req.user.sub,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/status')
  getStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.ordersService.getOrderStatus(id, req.user.sub);
  }

  /* ========================= GUEST ========================= */

  @Post('guest')
  createGuestOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createGuestOrder(dto);
  }

  /* ========================= AUTH USER ========================= */

  @UseGuards(JwtAuthGuard)
  @Post('authenticated')
  createAuthenticatedOrder(
    @Req() req: any,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createAuthenticatedUserOrder(
      req.user.sub,
      dto,
    );
  }

  /* ========================= VENDOR ========================= */

  // ✅ Voir ses commandes
  @UseGuards(JwtAuthGuard)
  @Get('vendor/my-orders')
  getVendorOrders(@Req() req: any) {
    return this.ordersService.findOrdersForVendor(
      req.user.vendorId,
    );
  }

  // ✅ Modifier statut (PENDING → PAID / CANCELLED)
  @UseGuards(JwtAuthGuard)
  @Patch('vendor/:id/status')
  updateOrderStatusByVendor(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: any,
  ) {
    return this.ordersService.updateOrderStatusByVendor(
      orderId,
      req.user.vendorId,
      dto.status,
    );
  }
}