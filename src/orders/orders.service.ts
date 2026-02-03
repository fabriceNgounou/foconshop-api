import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order-item-dto'; ;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste des commandes de l'utilisateur connecté
   */
  async findMyOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true, address: true, shipment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Détail d'une commande appartenant à l'utilisateur
   */
  async findOneMyOrder(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        address: true,
        shipment: { include: { events: { orderBy: { createdAt: 'asc' } } } },
      },
    });

    if (!order) throw new NotFoundException('Commande introuvable');
    return order;
  }

  /**
   * Annuler une commande PENDING
   */
  async cancel(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.status !== OrderStatus.PENDING) throw new BadRequestException('Cette commande ne peut plus être annulée');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  /**
   * Statut commande + livraison
   */
  async getOrderStatus(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { shipment: true },
    });

    if (!order) throw new NotFoundException('Commande introuvable');

    return {
      orderId: order.id,
      orderStatus: order.status,
      shipmentStatus: order.shipment?.status ?? null,
    };
  }

  /**
   * Création d'une commande guest (checkout sans compte)
   */
  async createGuestOrder(dto: CreateOrderDto) {
  let totalAmount = 0;

  const itemsData: {
    variantId: number;
    name: string;
    unitPrice: number;
    quantity: number;
  }[] = [];

  for (const item of dto.items) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: item.variantId },
      include: { product: true },
    });

    if (!variant) {
      throw new NotFoundException(`Variant ${item.variantId} introuvable`);
    }

    const unitPrice = variant.price;
    totalAmount += unitPrice * item.quantity;

    itemsData.push({
      variantId: variant.id,
      name: variant.product.title,
      unitPrice,
      quantity: item.quantity,
    });
  }

  // ✅ Adresse guest
  const address = await this.prisma.address.create({
    data: {
      userId: null,
      fullName: dto.address.fullName,
      phone: dto.address.phone,
      addressLine: dto.address.addressLine,
      city: dto.address.city,
      country: dto.address.country,
    },
  });

  // ✅ Commande
  const order = await this.prisma.order.create({
    data: {
      userId: null,
      guestName: dto.guestName,
      guestEmail: dto.guestEmail,
      guestPhone: dto.guestPhone,
      addressId: address.id,
      status: OrderStatus.PENDING,
      totalAmount,
      items: {
        create: itemsData,
      },
    },
    include: {
      items: true,
      address: true,
    },
  });

  // ✅ Facture
  await this.prisma.invoice.create({
    data: {
      orderId: order.id,
      reference: `INV-${Date.now()}`,
      type: 'DIGITAL',
      total: totalAmount,
    },
  });

  return order;
}   
}
