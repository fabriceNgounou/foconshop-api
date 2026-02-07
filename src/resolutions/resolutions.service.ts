import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResolutionType } from '@prisma/client';

@Injectable()
export class ResolutionsService {
  constructor(private prisma: PrismaService) {}

  async create(disputeId: number, type: ResolutionType, note?: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { resolution: true },
    });

    if (!dispute) {
      throw new NotFoundException('Litige introuvable');
    }

    if (dispute.resolution) {
      throw new BadRequestException(
        'Une résolution existe déjà pour ce litige',
      );
    }

    const resolution = await this.prisma.resolution.create({
      data: {
        disputeId,
        type,
        note,
      },
    });

    await this.prisma.dispute.update({
      where: { id: disputeId },
      data: { status: 'CLOSED' },
    });

    return resolution;
  }

  async findByDispute(disputeId: number) {
    return this.prisma.resolution.findUnique({
      where: { disputeId },
    });
  }
}
