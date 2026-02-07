import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CouponsService } from './coupons.service';
import { CheckCouponDto } from './dto/check-coupon.dto';

@Controller('coupons')
@UseGuards(JwtAuthGuard)
export class CouponsController {
  constructor(
    private readonly couponsService: CouponsService,
  ) {}

  /**
   * Vérifier un coupon
   */
  @Post('check')
  check(
    @Req() req: any,
    @Body() dto: CheckCouponDto,
  ) {
    return this.couponsService.checkCoupon(
      req.user.sub,
      dto.code,
    );
  }
}
