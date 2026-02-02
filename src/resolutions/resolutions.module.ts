// src/vendor/vendor.module.ts
import { Module } from '@nestjs/common';
import { ResolutionsController } from './resolutions.controller';
import { ResolutionsService } from './resolutions.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReturnsController } from 'src/returns/returns.controller';

@Module({
  controllers: [ResolutionsController],
  providers: [ResolutionsService, PrismaService],
  exports: [ResolutionsService],
})
export class ResolutionsModule {}