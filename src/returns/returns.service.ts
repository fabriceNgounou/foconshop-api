import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateReturnRequestDto) {
    // 1️⃣ Vérifier la commande
    const order = await this.prisma.order.findFirst({
      where: {
        id: dto.orderId,
        userId,
        status: OrderStatus.PAID,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(
        'Commande introuvable ou non éligible au retour',
      );
    }

    // 2️⃣ Vérification des items
    for (const item of dto.items) {
      const orderItem = order.items.find(
        i => i.id === item.orderItemId,
      );

      if (!orderItem) {
        throw new ForbiddenException(
          'Item non présent dans la commande',
        );
      }

      if (item.quantity > orderItem.quantity) {
        throw new BadRequestException(
          'Quantité retournée invalide',
        );
      }
    }

    // 3️⃣ Création du retour
    return this.prisma.returnRequest.create({
      data: {
        orderId: order.id,
        userId,
        reason: dto.reason,
        items: {
          create: dto.items.map(item => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            orderItem: true,
          },
        },
      },
    });
  }

  async findMyReturns(userId: number) {
    return this.prisma.returnRequest.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            orderItem: true,
          },
        },
        order: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
