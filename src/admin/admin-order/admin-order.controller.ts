// src/admin/orders/admin-orders.controller.ts
import { Controller, Get, Patch, Param, Body, UseGuards, Delete } from '@nestjs/common';
import { AdminOrdersService } from './admin-order.service';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrderStatus } from '@prisma/client';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get()
  findAll() {
    return this.adminOrdersService.findAllOrders();
  }

  @Get('vendor/:vendorId')
  findVendorOrders(@Param('vendorId') vendorId: number) {
    return this.adminOrdersService.findOrdersForVendor(+vendorId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: number, @Body('status') status: OrderStatus) {
    return this.adminOrdersService.updateOrderStatus(+id, status);
  }

  @Get('payment/:reference')
  getPaymentByReference(@Param('reference') reference: string) {
    return this.adminOrdersService.findPaymentByReference(reference);
  }

  @Get(':orderId/payments')
  getPaymentsByOrder(@Param('orderId') orderId: number) {
    return this.adminOrdersService.findPaymentsByOrder(+orderId);
  }

  @Delete(':id')
  deleteOrder(@Param('id') id: number) {
    return this.adminOrdersService.deleteOrderByAdmin(+id);
  }
}