import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  BadRequestException,
  Query,
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
  async quote(
    @Req() req: any,
    @Query('addressId', ParseIntPipe) addressId: number,
  ) {
    const userId = req.user.sub;

    if (!addressId) {
      throw new BadRequestException('addressId requis');
    }

    return this.checkoutService.quote(userId, addressId );
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
