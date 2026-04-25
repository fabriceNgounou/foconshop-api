// src/admin/loyalty/admin-loyalty.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoyaltySource, LoyaltyEntryType } from '@prisma/client';
import { AdjustLoyaltyPointsDto } from './dto/adjust-loyalty-points.dto';

@Injectable()
export class AdminLoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  /* -------------------------------------------------------------------------- */
  /*                           GESTION DES WALLETS                              */
  /* -------------------------------------------------------------------------- */

  /**
   * Liste tous les portefeuilles fidélité avec infos utilisateur
   */
  async getAllWallets() {
    return this.prisma.loyaltyWallet.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            entries: true, // Nombre de transactions
          },
        },
      },
      orderBy: { balance: 'desc' }, // Les plus riches d'abord
    });
  }

  /**
   * Récupérer un wallet spécifique par userId
   */
  async getWalletByUserId(userId: number) {
    const wallet = await this.prisma.loyaltyWallet.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException(
        `Aucun portefeuille trouvé pour l'utilisateur #${userId}`
      );
    }

    return wallet;
  }

  /* -------------------------------------------------------------------------- */
  /*                          HISTORIQUE DES POINTS                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Historique complet des mouvements de points d'un utilisateur
   */
  async getUserHistory(userId: number) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur #${userId} introuvable`);
    }

    const entries = await this.prisma.loyaltyEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      user,
      entries,
      totalEntries: entries.length,
      totalEarned: entries
        .filter((e) => e.type === LoyaltyEntryType.EARN)
        .reduce((sum, e) => sum + e.points, 0),
      totalSpent: entries
        .filter((e) => e.type === LoyaltyEntryType.SPEND)
        .reduce((sum, e) => sum + e.points, 0),
    };
  }

  /**
   * Statistiques globales de fidélité
   */
  async getGlobalStats() {
    const totalWallets = await this.prisma.loyaltyWallet.count();

    const totalPointsInCirculation = await this.prisma.loyaltyWallet.aggregate({
      _sum: {
        balance: true,
      },
    });

    const totalTransactions = await this.prisma.loyaltyEntry.count();

    const totalPointsEarned = await this.prisma.loyaltyEntry.aggregate({
      where: { type: LoyaltyEntryType.EARN },
      _sum: {
        points: true,
      },
    });

    const totalPointsSpent = await this.prisma.loyaltyEntry.aggregate({
      where: { type: LoyaltyEntryType.SPEND },
      _sum: {
        points: true,
      },
    });

    // Top 10 utilisateurs avec le plus de points
    const topUsers = await this.prisma.loyaltyWallet.findMany({
      take: 10,
      orderBy: { balance: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return {
      totalWallets,
      totalPointsInCirculation: totalPointsInCirculation._sum.balance || 0,
      totalTransactions,
      totalPointsEarned: totalPointsEarned._sum.points || 0,
      totalPointsSpent: totalPointsSpent._sum.points || 0,
      topUsers,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                        AJUSTEMENT MANUEL (ADMIN)                           */
  /* -------------------------------------------------------------------------- */

  /**
   * Ajuster manuellement le solde de points d'un utilisateur
   * (crédit ou débit selon le signe de points)
   */
  async adjustPoints(dto: AdjustLoyaltyPointsDto) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur #${dto.userId} introuvable`);
    }

    // Récupérer ou créer le wallet
    let wallet = await this.prisma.loyaltyWallet.findUnique({
      where: { userId: dto.userId },
    });

    if (!wallet) {
      wallet = await this.prisma.loyaltyWallet.create({
        data: { userId: dto.userId },
      });
    }

    // Si points négatif (débit), vérifier le solde
    if (dto.points < 0 && wallet.balance < Math.abs(dto.points)) {
      throw new BadRequestException(
        `Solde insuffisant. L'utilisateur a ${wallet.balance} points, ` +
        `vous essayez de retirer ${Math.abs(dto.points)} points.`
      );
    }

    // Déterminer le type d'opération
    const type = dto.points >= 0 ? LoyaltyEntryType.EARN : LoyaltyEntryType.SPEND;
    const absolutePoints = Math.abs(dto.points);

    // Effectuer l'ajustement dans une transaction
    return this.prisma.$transaction(async (tx) => {
      // Créer l'entrée d'historique
      const entry = await tx.loyaltyEntry.create({
        data: {
          walletId: wallet!.id,
          userId: dto.userId,
          type,
          source: LoyaltySource.ADMIN,
          points: absolutePoints,
          reference: dto.reference || 'Ajustement manuel admin',
        },
      });

      // Mettre à jour le solde
      const updatedWallet = await tx.loyaltyWallet.update({
        where: { id: wallet!.id },
        data: {
          balance: dto.points >= 0 
            ? { increment: absolutePoints } 
            : { decrement: absolutePoints },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      return {
        message: dto.points >= 0 
          ? `${absolutePoints} points ajoutés avec succès` 
          : `${absolutePoints} points retirés avec succès`,
        entry,
        wallet: updatedWallet,
      };
    });
  }
}