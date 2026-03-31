// src/shipments/orders.module.ts
import { Module } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';
import {NotificationModule} from "../notifications/notification.module";

@Module({
  controllers: [ShipmentsController],
  providers: [ShipmentsService,],
  imports: [NotificationModule],
})
export class ShipmentsModule {}