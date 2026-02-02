import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';

@Controller('disputes')
@UseGuards(JwtAuthGuard)
export class DisputesController {
  constructor(
    private readonly disputesService: DisputesService,
  ) {}

  /**
   * ➕ Ouvrir un litige
   */
  @Post()
  async create(
    @Req() req: any,
    @Body() dto: CreateDisputeDto,
  ) {
    return this.disputesService.create(req.user.sub, dto);
  }

  /**
   * 📄 Mes litiges
   */
  @Get('me')
  async myDisputes(@Req() req: any) {
    return this.disputesService.findMyDisputes(req.user.sub);
  }
}
