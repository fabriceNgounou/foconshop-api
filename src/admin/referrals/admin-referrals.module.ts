// src/admin/referrals/admin-referrals.module.ts
import { Module } from '@nestjs/common';
import { AdminReferralsService } from './admin-referrals.service';
import { AdminReferralsController } from './admin-referrals.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminReferralsController],
  providers: [AdminReferralsService],
  exports: [AdminReferralsService],
})
export class AdminReferralsModule {}