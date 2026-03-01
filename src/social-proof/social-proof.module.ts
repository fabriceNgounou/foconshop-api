// src/social-proof/social-proof.module.ts
import { Module } from '@nestjs/common';
import { SocialProofService } from './social-proof.service';
import { SocialProofController } from './social-proof.controller';

@Module({
  controllers: [SocialProofController],
  providers: [SocialProofService,],
})
export class SocialProofModule {}
