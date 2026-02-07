import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShipmentsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
