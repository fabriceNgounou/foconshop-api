import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PromotionModule } from 'src/promotion/promotion.module';

@Module({
  imports: [PromotionModule],
  controllers: [CartController],
  providers: [CartService,],
})
export class CartModule {}