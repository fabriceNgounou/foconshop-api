import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService, // ✅ injection
  ) {}

  /**
   * Récupérer le shipment d'une commande (client)
   */
  async getShipmentByOrder(orderId: number, userId: number) {
    const shipment = await this.prisma.shipment.findFirst({
      where: {
        order: {
          id: orderId,
          userId,
        },
      },
      include: {
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException('Aucune livraison trouvée');
    }

    return {
      orderId,
      shipmentStatus: shipment.status,
      tracking: shipment.events.map(event => ({
        label: event.label,
        date: event.createdAt,
      })),
    };
  }

  /**
   * Marquer une commande comme expédiée et notifier le client
   */
  async shipOrder(orderId: number) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { orderId },
      include: { order: true },
    });

    if (!shipment) throw new NotFoundException('Expédition introuvable');

    const updatedShipment = await this.prisma.shipment.update({
      where: { orderId },
      data: { status: 'DELIVERED' },
    });

    // 🔔 Notification client
    if (shipment.order.userId) {
      await this.notificationService.createNotification({
        userId: shipment.order.userId,
        title: 'Commande expédiée',
        message: `Votre commande #${orderId} est en route`,
        type: NotificationType.ORDER_SHIPPED,
      });
    }

    return updatedShipment;
  }
}