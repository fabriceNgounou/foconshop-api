import { Controller, Get } from '@nestjs/common';
import { SocialProofService } from './social-proof.service';

@Controller('social-proof')
export class SocialProofController {
  constructor(private readonly service: SocialProofService) {}

  @Get('recent')
  getRecentPurchases() {
    return this.service.getRecent();
  }
}