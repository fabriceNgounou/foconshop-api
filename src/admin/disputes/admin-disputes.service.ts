import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DisputeStatus } from '@prisma/client';

@Injectable()
export class AdminDisputesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllDisputes() {
    return this.prisma.dispute.findMany({
      include: {
        user: true,
        order: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateDisputeStatus(disputeId: number, status: DisputeStatus) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException('Litige introuvable');
    }

    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: { status },
    });
  }
}

