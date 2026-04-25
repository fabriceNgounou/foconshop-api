// src/admin/referrals/admin-referrals.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminReferralsService } from './admin-referrals.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin/referrals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminReferralsController {
  constructor(
    private readonly adminReferralsService: AdminReferralsService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                        LISTE DES PARRAINAGES                               */
  /* -------------------------------------------------------------------------- */

  /**
   * GET /admin/referrals
   * Liste tous les parrainages
   */
  @Get()
  getAllReferrals() {
    return this.adminReferralsService.getAllReferrals();
  }

  /**
   * GET /admin/referrals/user/:userId
   * Liste des parrainages effectués par un utilisateur
   */
  @Get('user/:userId')
  getReferralsByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.adminReferralsService.getReferralsByUser(userId);
  }

  /* -------------------------------------------------------------------------- */
  /*                          STATISTIQUES GLOBALES                             */
  /* -------------------------------------------------------------------------- */

  /**
   * GET /admin/referrals/stats
   * Statistiques globales du programme de parrainage
   */
  @Get('stats')
  getGlobalStats() {
    return this.adminReferralsService.getGlobalStats();
  }

  /* -------------------------------------------------------------------------- */
  /*                        GESTION DES RÉCOMPENSES                             */
  /* -------------------------------------------------------------------------- */

  /**
   * PATCH /admin/referrals/:id/reward
   * Marquer une récompense de parrainage comme donnée
   */
  @Patch(':id/reward')
  @HttpCode(HttpStatus.OK)
  markRewardAsGiven(@Param('id', ParseIntPipe) id: number) {
    return this.adminReferralsService.markRewardAsGiven(id);
  }
}