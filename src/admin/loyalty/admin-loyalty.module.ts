// src/admin/loyalty/admin-loyalty.module.ts
import { Module } from '@nestjs/common';
import { AdminLoyaltyService } from './admin-loyalty.service';
import { AdminLoyaltyController } from './admin-loyalty.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminLoyaltyController],
  providers: [AdminLoyaltyService],
  exports: [AdminLoyaltyService],
})
export class AdminLoyaltyModule {}