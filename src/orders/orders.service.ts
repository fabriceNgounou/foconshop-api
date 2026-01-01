// src/orders/orders.service.ts

import { Injectable, NotFoundException, BadRequestException,
  ForbiddenException, } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste des commandes de l'utilisateur connecté
   */
  async findMyOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        address: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Détail d'une commande appartenant à l'utilisateur
   */
  async findOneMyOrder(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: true,
        address: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    return order;
  }

  async markAsPaid(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Cette commande ne peut plus être payée',
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAID },
    });
  }

  async cancel(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Cette commande ne peut plus être annulée',
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  }
}
