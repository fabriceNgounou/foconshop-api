import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ResolutionsService } from './resolutions.service';
import { CreateResolutionDto } from './dto/create-resolution.dto';

@Controller('resolutions')
export class ResolutionsController {
  constructor(
    private readonly resolutionsService: ResolutionsService,
  ) {}

  /**
   * ➕ Créer une résolution
   */
  @Post()
  create(@Body() dto: CreateResolutionDto) {
    return this.resolutionsService.create(
      dto.disputeId,
      dto.type,
      dto.note,
    );
  }

  /**
   * 🔍 Résolution d’un litige
   */
  @Get(':disputeId')
  findOne(
    @Param('disputeId', ParseIntPipe) disputeId: number,
  ) {
    return this.resolutionsService.findByDispute(disputeId);
  }
}
