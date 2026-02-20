// src/media/media.module.ts
import { Module } from '@nestjs/common';
import { AdminVendorsController } from './admin-vendor.controller';
import { AdminVendorsService } from './admin-vendor.service';

@Module({
  controllers: [AdminVendorsController],
  providers: [AdminVendorsService],
})
export class AdminVendorModule {}