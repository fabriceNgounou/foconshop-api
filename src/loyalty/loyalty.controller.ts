import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoyaltyService } from './loyalty.service';
import { AddPointsDto } from './dto/add-points.dto';
import { SpendPointsDto } from './dto/spend-points.dto';

@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('wallet')
  getWallet(@Req() req: any) {
    return this.loyaltyService.getWallet(req.user.sub);
  }

  @Get('history')
  getHistory(@Req() req: any) {
    return this.loyaltyService.getHistory(req.user.sub);
  }

  @Post('earn')
  earn(@Req() req: any, @Body() dto: AddPointsDto) {
    return this.loyaltyService.addPoints(
      req.user.sub,
      dto.points,
      dto.source,
      dto.reference,
    );
  }

  @Post('spend')
  spend(@Req() req: any, @Body() dto: SpendPointsDto) {
    return this.loyaltyService.spendPoints(
      req.user.sub,
      dto.points,
    );
  }
}
