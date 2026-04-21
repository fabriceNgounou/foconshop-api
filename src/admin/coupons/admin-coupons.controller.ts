// src/admin/coupons/admin-coupons.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminCouponsService } from './admin-coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminCouponsController {
  constructor(private readonly adminCouponsService: AdminCouponsService) {}

  /* -------------------------------------------------------------------------- */
  /*                              CRUD COUPONS                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * GET /admin/coupons
   * Liste tous les coupons
   */
  @Get()
  getAllCoupons() {
    return this.adminCouponsService.getAllCoupons();
  }

  /**
   * GET /admin/coupons/:id
   * Récupérer un coupon par ID
   */
  @Get(':id')
  getCouponById(@Param('id', ParseIntPipe) id: number) {
    return this.adminCouponsService.getCouponById(id);
  }

  /**
   * POST /admin/coupons
   * Créer un nouveau coupon
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.adminCouponsService.createCoupon(dto);
  }

  /**
   * PATCH /admin/coupons/:id
   * Mettre à jour un coupon
   */
  @Patch(':id')
  updateCoupon(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.adminCouponsService.updateCoupon(id, dto);
  }

  /**
   * DELETE /admin/coupons/:id
   * Supprimer un coupon (seulement s'il n'a jamais été utilisé)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteCoupon(@Param('id', ParseIntPipe) id: number) {
    return this.adminCouponsService.deleteCoupon(id);
  }

  /* -------------------------------------------------------------------------- */
  /*                         ANALYTICS & STATISTIQUES                           */
  /* -------------------------------------------------------------------------- */

  /**
   * GET /admin/coupons/:id/usages
   * Liste des utilisations d'un coupon
   */
  @Get(':id/usages')
  getCouponUsages(@Param('id', ParseIntPipe) couponId: number) {
    return this.adminCouponsService.getCouponUsages(couponId);
  }

  /**
   * GET /admin/coupons/:id/stats
   * Statistiques détaillées d'un coupon
   */
  @Get(':id/stats')
  getCouponStats(@Param('id', ParseIntPipe) couponId: number) {
    return this.adminCouponsService.getCouponStats(couponId);
  }
}