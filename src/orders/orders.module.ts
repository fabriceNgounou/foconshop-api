// src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { VendorOrdersController } from './vendor-orders.controller';

@Module({
  controllers: [OrdersController,VendorOrdersController,],
  providers: [OrdersService,],
})
export class OrdersModule {}
