// src/admin/orders/admin-orders.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /* -------------------------------------------------------------------------- */
  /*                     1️⃣ Lister toutes les commandes                        */
  /* -------------------------------------------------------------------------- */
  async findAllOrders() {
    return this.prisma.order.findMany({
      include: {
        user: true,
        items: { include: { variant: { include: { product: true } } } },
        address: true,
        shipment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                     2️⃣ Lister commandes pour un vendeur                   */
  /* -------------------------------------------------------------------------- */
  async findOrdersForVendor(vendorUserId: number) {
    const vendor = await this.prisma.vendorProfile.findFirst({ where: { userId: vendorUserId } });
    if (!vendor) return [];

    return this.prisma.order.findMany({
      where: { items: { some: { variant: { product: { vendorId: vendor.id } } } } },
      include: {
        items: { include: { variant: { include: { product: true } } } },
        user: true,
        address: true,
        shipment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                     3️⃣ Mise à jour du statut d'une commande              */
  /* -------------------------------------------------------------------------- */
  async updateOrderStatus(orderId: number, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: true,
        address: true,
        shipment: true,
      },
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                     4️⃣ Récupérer un paiement par référence               */
  /* -------------------------------------------------------------------------- */
  async findPaymentByReference(reference: string) {
    if (!reference.startsWith('PAY-')) throw new BadRequestException('Référence invalide');

    const paymentId = Number(reference.replace('PAY-', ''));
    return this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true, attempts: true },
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                     5️⃣ Récupérer tous les paiements d'une commande       */
  /* -------------------------------------------------------------------------- */
  async findPaymentsByOrder(orderId: number) {
    return this.prisma.payment.findMany({
      where: { orderId },
      include: { attempts: true },
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                     6️⃣ Supprimer complètement une commande               */
  /* -------------------------------------------------------------------------- */
  async deleteOrderByAdmin(orderId: number) {
  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, shipment: true },
  });
  if (!order) throw new NotFoundException('Commande introuvable');

  return this.prisma.$transaction(async (tx) => {
    // 1️⃣ Supprimer les items
    await tx.orderItem.deleteMany({ where: { orderId } });

    // Suppromer la facture
          await tx.invoice.deleteMany({ where: { orderId } });
          
    // 2️⃣ Supprimer les shipments
    await tx.shipment.deleteMany({ where: { orderId } });

    // 3️⃣ Supprimer les paiements associés
    await tx.payment.deleteMany({ where: { orderId } });

    // 4️⃣ Supprimer la commande
    return tx.order.delete({ where: { id: orderId } });
  });
}
}