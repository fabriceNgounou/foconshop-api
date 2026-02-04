// src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { VendorOrdersController } from './vendor-orders.controller';

@Module({
  controllers: [OrdersController,VendorOrdersController,],
  providers: [OrdersService, PrismaService],
})
export class OrdersModule {}
