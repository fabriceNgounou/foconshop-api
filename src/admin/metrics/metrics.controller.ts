import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin/metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * 📈 Ventes globales
   * GET /admin/metrics/sales
   * GET /admin/metrics/sales?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  @Get('sales')
  getSales(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.metricsService.getSalesMetrics(from, to);
  }

  /**
   * 🛍️ Top catégories
   * GET /admin/metrics/top-categories
   */
  @Get('top-categories')
  getTopCategories() {
    return this.metricsService.getTopCategories();
  }

  /**
   * 🏙️ Ventes par ville
   * GET /admin/metrics/cities
   */
  @Get('cities')
  getSalesByCity() {
    return this.metricsService.getSalesByCity();
  }
}
