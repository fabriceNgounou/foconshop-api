// src/admin/loyalty/admin-loyalty.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminLoyaltyService } from './admin-loyalty.service';
import { AdjustLoyaltyPointsDto } from './dto/adjust-loyalty-points.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin/loyalty')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminLoyaltyController {
  constructor(private readonly adminLoyaltyService: AdminLoyaltyService) {}

  /* -------------------------------------------------------------------------- */
  /*                           GESTION DES WALLETS                              */
  /* -------------------------------------------------------------------------- */

  /**
   * GET /admin/loyalty/wallets
   * Liste tous les portefeuilles de fidélité
   */
  @Get('wallets')
  getAllWallets() {
    return this.adminLoyaltyService.getAllWallets();
  }

  /**
   * GET /admin/loyalty/wallets/:userId
   * Récupérer le wallet d'un utilisateur spécifique
   */
  @Get('wallets/:userId')
  getWalletByUserId(@Query('userId', ParseIntPipe) userId: number) {
    return this.adminLoyaltyService.getWalletByUserId(userId);
  }

  /* -------------------------------------------------------------------------- */
  /*                          HISTORIQUE DES POINTS                             */
  /* -------------------------------------------------------------------------- */

  /**
   * GET /admin/loyalty/history?userId=X
   * Historique complet des mouvements de points d'un utilisateur
   */
  @Get('history')
  getUserHistory(@Query('userId', ParseIntPipe) userId: number) {
    return this.adminLoyaltyService.getUserHistory(userId);
  }

  /**
   * GET /admin/loyalty/stats
   * Statistiques globales du programme de fidélité
   */
  @Get('stats')
  getGlobalStats() {
    return this.adminLoyaltyService.getGlobalStats();
  }

  /* -------------------------------------------------------------------------- */
  /*                        AJUSTEMENT MANUEL (ADMIN)                           */
  /* -------------------------------------------------------------------------- */

  /**
   * POST /admin/loyalty/adjust
   * Ajuster manuellement le solde de points d'un utilisateur
   */
  @Post('adjust')
  @HttpCode(HttpStatus.OK)
  adjustPoints(@Body() dto: AdjustLoyaltyPointsDto) {
    return this.adminLoyaltyService.adjustPoints(dto);
  }
}