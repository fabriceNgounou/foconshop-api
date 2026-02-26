// src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { VendorOrdersController } from './vendor-orders.controller';
import { EmailService } from 'src/email/email.service';
import { InvoiceService } from 'src/invoice/invoice.service';

@Module({
  controllers: [OrdersController,VendorOrdersController,],
  providers: [OrdersService,EmailService,InvoiceService],
})
export class OrdersModule {}
