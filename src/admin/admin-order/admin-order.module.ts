// src/media/media.module.ts
import { Module } from '@nestjs/common';
import { AdminOrdersController } from './admin-order.controller';
import { AdminOrdersService } from './admin-order.service';

@Module({
  controllers: [AdminOrdersController],
  providers: [AdminOrdersService,],
})
export class AdminOrderModule {}