import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReferralService } from './referral.service';
import { ApplyReferralDto } from './dto/apply-referral.dto';

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(
    private readonly referralService: ReferralService,
  ) {}

  @Get('me')
  getMyCode(@Req() req: any) {
    return this.referralService.getMyCode(req.user.sub);
  }

  @Post('apply')
  apply(
    @Req() req: any,
    @Body() dto: ApplyReferralDto,
  ) {
    return this.referralService.applyCode(
      req.user.sub,
      dto.code,
    );
  }

  @Get('my-referrals')
  myReferrals(@Req() req: any) {
    return this.referralService.getMyReferrals(
      req.user.sub,
    );
  }
}
