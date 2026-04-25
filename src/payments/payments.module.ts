// src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import {NotificationModule} from "../notifications/notification.module";
@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService,LoyaltyService],
  imports: [NotificationModule],
})
export class PaymentsModule {}