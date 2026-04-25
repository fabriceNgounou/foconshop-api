// src/admin/referrals/admin-referrals.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  /* -------------------------------------------------------------------------- */
  /*                        LISTE DES PARRAINAGES                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Liste TOUS les parrainages avec détails parrain et filleul
   */
  async getAllReferrals() {
    return this.prisma.referral.findMany({
      include: {
        referrer: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
        referee: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Liste des parrainages effectués par un utilisateur (en tant que parrain)
   */
  async getReferralsByUser(userId: number) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur #${userId} introuvable`);
    }

    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referee: {
          select: {
            id: true,
            username: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      referrer: user,
      referrals,
      totalReferrals: referrals.length,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                          STATISTIQUES GLOBALES                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Statistiques globales du programme de parrainage
   */
  async getGlobalStats() {
    // Nombre total de parrainages
    const totalReferrals = await this.prisma.referral.count();

    // Nombre de parrainages avec récompense donnée
    const referralsWithReward = await this.prisma.referral.count({
      where: { rewardGiven: true },
    });

    // Nombre de parrainages en attente de récompense
    const referralsPendingReward = await this.prisma.referral.count({
      where: { rewardGiven: false },
    });

    // Top 10 parrains (ceux qui ont parrainé le plus)
    const topReferrers = await this.prisma.referral.groupBy({
      by: ['referrerId'],
      _count: {
        referrerId: true,
      },
      orderBy: {
        _count: {
          referrerId: 'desc',
        },
      },
      take: 10,
    });

    // Enrichir avec les infos utilisateur
    const topReferrersWithDetails = await Promise.all(
      topReferrers.map(async (item) => {
        const user = await this.prisma.user.findUnique({
          where: { id: item.referrerId },
          select: {
            id: true,
            username: true,
            email: true,
          },
        });

        return {
          ...user,
          referralCount: item._count.referrerId,
        };
      })
    );

    // Parrainages récents (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentReferrals = await this.prisma.referral.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Parrainages ce mois-ci
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const referralsThisMonth = await this.prisma.referral.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    return {
      totalReferrals,
      referralsWithReward,
      referralsPendingReward,
      rewardRate: totalReferrals > 0 
        ? `${((referralsWithReward / totalReferrals) * 100).toFixed(2)}%` 
        : '0%',
      recentReferralsLast7Days: recentReferrals,
      referralsThisMonth,
      topReferrers: topReferrersWithDetails,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                        GESTION DES RÉCOMPENSES                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Marquer une récompense de parrainage comme donnée
   */
  async markRewardAsGiven(referralId: number) {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        referrer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        referee: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!referral) {
      throw new NotFoundException(`Parrainage #${referralId} introuvable`);
    }

    if (referral.rewardGiven) {
      return {
        message: 'La récompense a déjà été donnée pour ce parrainage',
        referral,
      };
    }

    const updatedReferral = await this.prisma.referral.update({
      where: { id: referralId },
      data: { rewardGiven: true },
      include: {
        referrer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        referee: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Récompense marquée comme donnée avec succès',
      referral: updatedReferral,
    };
  }
}