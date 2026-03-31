// src/coupons/Coupons.module.ts
import { Module } from '@nestjs/common';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';
import { NotificationModule } from 'src/notifications/notification.module';

@Module({
  controllers: [DisputesController],
  providers: [DisputesService,],
  imports: [NotificationModule],
})
export class DisputeModule {}
