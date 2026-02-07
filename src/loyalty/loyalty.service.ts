import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  LoyaltyEntryType,
  LoyaltySource,
} from '@prisma/client';

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupérer ou créer le wallet
   */
  private async getOrCreateWallet(userId: number) {
    let wallet = await this.prisma.loyaltyWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.loyaltyWallet.create({
        data: { userId },
      });
    }

    return wallet;
  }

  /**
   * Consulter le solde
   */
  async getWallet(userId: number) {
    const wallet = await this.getOrCreateWallet(userId);

    return {
      balance: wallet.balance,
    };
  }

  /**
   * Historique des points
   */
  async getHistory(userId: number) {
    return this.prisma.loyaltyEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Ajouter des points
   */
  async addPoints(
    userId: number,
    points: number,
    source: LoyaltySource,
    reference?: string,
  ) {
    const wallet = await this.getOrCreateWallet(userId);

    return this.prisma.$transaction(async (tx) => {
      await tx.loyaltyEntry.create({
        data: {
          walletId: wallet.id,
          userId,
          type: LoyaltyEntryType.EARN,
          source,
          points,
          reference,
        },
      });

      const updatedWallet = await tx.loyaltyWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: points } },
      });

      return {
        balance: updatedWallet.balance,
      };
    });
  }

  /**
   * Dépenser des points
   */
  async spendPoints(userId: number, points: number) {
    const wallet = await this.getOrCreateWallet(userId);

    if (wallet.balance < points) {
      throw new BadRequestException('Solde insuffisant');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.loyaltyEntry.create({
        data: {
          walletId: wallet.id,
          userId,
          type: LoyaltyEntryType.SPEND,
          source: LoyaltySource.ORDER,
          points,
        },
      });

      const updatedWallet = await tx.loyaltyWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: points } },
      });

      return {
        balance: updatedWallet.balance,
      };
    });
  }
}
