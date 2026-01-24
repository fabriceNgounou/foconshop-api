import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferralService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupérer mon "code" de parrainage
   * (simplement mon userId)
   */
  async getMyCode(userId: number) {
    return {
      code: userId.toString(),
    };
  }

  /**
   * Appliquer un parrainage
   */
  async applyCode(userId: number, code: string) {
    const referrerId = Number(code);

    if (isNaN(referrerId)) {
      throw new BadRequestException('Code invalide');
    }

    if (referrerId === userId) {
      throw new BadRequestException(
        'Auto-parrainage interdit',
      );
    }

    const referrer = await this.prisma.user.findUnique({
      where: { id: referrerId },
    });

    if (!referrer) {
      throw new BadRequestException('Parrain inexistant');
    }

    const alreadyReferred = await this.prisma.referral.findFirst({
      where: { refereeId: userId },
    });

    if (alreadyReferred) {
      throw new BadRequestException(
        'Parrainage déjà utilisé',
      );
    }

    await this.prisma.referral.create({
      data: {
        referrerId,
        refereeId: userId,
      },
    });

    return {
      message: 'Parrainage enregistré avec succès',
    };
  }

  /**
   * Liste de mes filleuls
   */
  async getMyReferrals(userId: number) {
    return this.prisma.referral.findMany({
      where: { referrerId: userId },
      select: {
        id: true,
        createdAt: true,
        referee: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
