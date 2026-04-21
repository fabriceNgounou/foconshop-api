// src/admin/coupons/admin-coupons.module.ts
import { Module } from '@nestjs/common';
import { AdminCouponsService } from './admin-coupons.service';
import { AdminCouponsController } from './admin-coupons.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminCouponsController],
  providers: [AdminCouponsService],
  exports: [AdminCouponsService],
})
export class AdminCouponsModule {}