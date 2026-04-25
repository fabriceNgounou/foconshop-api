// src/vendor/vendor.module.ts
import { Module } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';
import { VendorPublicController } from './vendor-public.controller';
import {NotificationModule} from "../notifications/notification.module";


@Module({
  controllers: [VendorController,VendorPublicController],
  providers: [VendorService,],
  exports: [VendorService],
  imports: [NotificationModule],
})
export class VendorModule {}
