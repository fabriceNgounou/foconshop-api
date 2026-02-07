import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class DisputesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateDisputeDto) {
    // 1️⃣ Vérifier la commande
    const order = await this.prisma.order.findFirst({
      where: {
        id: dto.orderId,
        userId,
        status: OrderStatus.PAID,
      },
    });

    if (!order) {
      throw new NotFoundException(
        'Commande introuvable ou non éligible au litige',
      );
    }

    // 2️⃣ Vérifier l’unicité du litige
    const existingDispute = await this.prisma.dispute.findFirst({
      where: {
        orderId: order.id,
      },
    });

    if (existingDispute) {
      throw new BadRequestException(
        'Un litige existe déjà pour cette commande',
      );
    }

    // 3️⃣ Création du litige
    return this.prisma.dispute.create({
      data: {
        orderId: order.id,
        userId,
        message: dto.message,
      },
    });
  }

  async findMyDisputes(userId: number) {
    return this.prisma.dispute.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
