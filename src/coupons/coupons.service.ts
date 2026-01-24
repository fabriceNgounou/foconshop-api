import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Vérifier la validité d’un coupon pour un utilisateur
   */
  async checkCoupon(userId: number, code: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      throw new BadRequestException('Coupon invalide');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('Coupon désactivé');
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('Coupon expiré');
    }

    if (
      coupon.maxUses !== null &&
      coupon.usedCount >= coupon.maxUses
    ) {
      throw new BadRequestException(
        'Coupon épuisé',
      );
    }

    const alreadyUsed =
      await this.prisma.couponUsage.findUnique({
        where: {
          couponId_userId: {
            couponId: coupon.id,
            userId,
          },
        },
      });

    if (alreadyUsed) {
      throw new BadRequestException(
        'Coupon déjà utilisé',
      );
    }

    return {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
    };
  }

  /**
   * Marquer un coupon comme utilisé
   * (appelé plus tard lors de la validation d’une commande)
   */
  async markAsUsed(
    couponId: number,
    userId: number,
  ) {
    await this.prisma.$transaction(async tx => {
      await tx.couponUsage.create({
        data: {
          couponId,
          userId,
        },
      });

      await tx.coupon.update({
        where: { id: couponId },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });
    });
  }
}
