// src/admin/coupons/admin-coupons.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class AdminCouponsService {
  constructor(private readonly prisma: PrismaService) {}

  /* -------------------------------------------------------------------------- */
  /*                           CRUD COUPONS (ADMIN)                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Liste TOUS les coupons (actifs et inactifs)
   */
  async getAllCoupons() {
    return this.prisma.coupon.findMany({
      include: {
        _count: {
          select: {
            usages: true, // Nombre d'utilisations réelles
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Récupérer un coupon par ID
   */
  async getCouponById(id: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usages: true,
          },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon #${id} introuvable`);
    }

    return coupon;
  }

  /**
   * Créer un nouveau coupon
   */
  async createCoupon(dto: CreateCouponDto) {
    // Vérifier l'unicité du code (insensible à la casse)
    const existingCoupon = await this.prisma.coupon.findFirst({
      where: {
        code: {
          equals: dto.code,
          mode: 'insensitive',
        },
      },
    });

    if (existingCoupon) {
      throw new ConflictException(
        `Un coupon avec le code "${dto.code}" existe déjà`
      );
    }

    // Validation : si PERCENTAGE, value doit être entre 0 et 100
    if (dto.type === 'PERCENTAGE' && (dto.value < 0 || dto.value > 100)) {
      throw new BadRequestException(
        'Pour un coupon PERCENTAGE, la valeur doit être entre 0 et 100'
      );
    }

    // Validation : si FIXED, value doit être positive
    if (dto.type === 'FIXED' && dto.value < 0) {
      throw new BadRequestException(
        'Pour un coupon FIXED, la valeur doit être positive'
      );
    }

    // Validation : expiresAt doit être dans le futur
    if (dto.expiresAt && new Date(dto.expiresAt) <= new Date()) {
      throw new BadRequestException(
        'La date d\'expiration doit être dans le futur'
      );
    }

    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(), // Forcer majuscules
        type: dto.type,
        value: dto.value,
        maxUses: dto.maxUses ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * Mettre à jour un coupon existant
   */
  async updateCoupon(id: number, dto: UpdateCouponDto) {
    // Vérifier que le coupon existe
    await this.getCouponById(id);

    // Si le code change, vérifier l'unicité
    if (dto.code) {
      const existingCoupon = await this.prisma.coupon.findFirst({
        where: {
          code: {
            equals: dto.code,
            mode: 'insensitive',
          },
          NOT: { id }, // Exclure le coupon actuel
        },
      });

      if (existingCoupon) {
        throw new ConflictException(
          `Un autre coupon avec le code "${dto.code}" existe déjà`
        );
      }
    }

    // Validation : PERCENTAGE entre 0 et 100
    if (dto.type === 'PERCENTAGE' && dto.value !== undefined) {
      if (dto.value < 0 || dto.value > 100) {
        throw new BadRequestException(
          'Pour un coupon PERCENTAGE, la valeur doit être entre 0 et 100'
        );
      }
    }

    // Validation : FIXED positif
    if (dto.type === 'FIXED' && dto.value !== undefined) {
      if (dto.value < 0) {
        throw new BadRequestException(
          'Pour un coupon FIXED, la valeur doit être positive'
        );
      }
    }

    // Validation : expiresAt dans le futur
    if (dto.expiresAt && new Date(dto.expiresAt) <= new Date()) {
      throw new BadRequestException(
        'La date d\'expiration doit être dans le futur'
      );
    }

    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...(dto.code && { code: dto.code.toUpperCase() }),
        ...(dto.type && { type: dto.type }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.maxUses !== undefined && { maxUses: dto.maxUses }),
        ...(dto.expiresAt !== undefined && {
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  /**
   * Supprimer un coupon
   */
  async deleteCoupon(id: number) {
    // Vérifier que le coupon existe
    await this.getCouponById(id);

    // Vérifier s'il a été utilisé
    const usageCount = await this.prisma.couponUsage.count({
      where: { couponId: id },
    });

    if (usageCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer un coupon qui a déjà été utilisé ${usageCount} fois. ` +
        `Vous pouvez le désactiver en mettant isActive = false.`
      );
    }

    await this.prisma.coupon.delete({
      where: { id },
    });

    return {
      message: `Coupon #${id} supprimé avec succès`,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                          ANALYTICS & STATISTIQUES                          */
  /* -------------------------------------------------------------------------- */

  /**
   * Liste des utilisations d'un coupon spécifique
   */
  async getCouponUsages(couponId: number) {
    // Vérifier que le coupon existe
    await this.getCouponById(couponId);

    return this.prisma.couponUsage.findMany({
      where: { couponId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { usedAt: 'desc' },
    });
  }

  /**
   * Statistiques globales d'un coupon
   */
  async getCouponStats(couponId: number) {
    const coupon = await this.getCouponById(couponId);

    const usages = await this.prisma.couponUsage.findMany({
      where: { couponId },
      select: {
        discountAmount: true,
        usedAt: true,
      },
    });

    // Calcul du CA perdu (total des réductions)
    const totalDiscount = usages.reduce(
      (sum, usage) => sum + (usage.discountAmount || 0),
      0
    );

    // Nombre d'utilisations
    const usageCount = usages.length;

    // Taux d'utilisation si maxUses défini
    const usageRate = coupon.maxUses
      ? (usageCount / coupon.maxUses) * 100
      : null;

    // Utilisation par jour (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsages = usages.filter(
      (u) => new Date(u.usedAt) >= sevenDaysAgo
    );

    return {
      couponId,
      code: coupon.code,
      totalUsages: usageCount,
      maxUsages: coupon.maxUses,
      usageRate: usageRate ? `${usageRate.toFixed(2)}%` : 'Illimité',
      totalDiscountGiven: totalDiscount,
      recentUsagesLast7Days: recentUsages.length,
      isExpired: coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false,
      isActive: coupon.isActive,
    };
  }
}