import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Get('quote')
  async quote(@Req() req: any) {
    const userId = req.user.sub;
    return this.checkoutService.quote(userId);
  }

  @Post('confirm')
  confirm(
    @Req() req: any,
    @Body('addressId') addressId: number,
  ) {
    const userId = req.user.sub;
    return this.checkoutService.confirmCheckout(userId, addressId);
  }
}
