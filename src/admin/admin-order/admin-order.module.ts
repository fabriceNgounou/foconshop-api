// src/media/media.module.ts
import { Module } from '@nestjs/common';
import { AdminOrdersController } from './admin-order.controller';
import { AdminOrdersService } from './admin-order.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [AdminOrdersController],
  providers: [AdminOrdersService, PrismaService],
})
export class AdminOrderModule {}