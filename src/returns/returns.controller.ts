import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReturnsService } from './returns.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  /**
   * 📦 Initier un retour
   */
  @Post()
  async create(
    @Req() req: any,
    @Body() dto: CreateReturnRequestDto,
  ) {
    return this.returnsService.create(req.user.sub, dto);
  }

  /**
   * 📄 Mes demandes de retour
   */
  @Get('me')
  async myReturns(@Req() req: any) {
    return this.returnsService.findMyReturns(req.user.sub);
  }
}
