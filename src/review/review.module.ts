// src/vendor/vendor.module.ts
import { Module } from '@nestjs/common';
import { ReviewsService } from './review.service';
import { ReviewsController } from './review.controller';
import {NotificationModule} from "../notifications/notification.module";

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
  imports: [NotificationModule],
})
export class ReviewsModule {}