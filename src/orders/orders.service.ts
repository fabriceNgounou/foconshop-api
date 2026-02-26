// src/orders/orders.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {OrderStatus} from '@prisma/client';
import { CreateOrderDto } from './dto/create-order-item-dto';
import { EmailService } from '../email/email.service';
import { InvoiceService } from '../invoice/invoice.service';

@Injectable()
export class OrdersService {
   constructor(
      private readonly prisma: PrismaService,
      private readonly emailService: EmailService,
      private readonly invoiceService: InvoiceService,
    ) {}

  /**
   * CLIENT : mes commandes
   */
  async findMyOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true, address: true, shipment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * CLIENT : détail commande
   */
  async findOneMyOrder(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        address: true,
        shipment: {
          include: {
            events: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    return order;
  }

  /**
   * CLIENT : annulation
   */
  async cancel(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Cette commande ne peut plus être annulée');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  /**
   * CLIENT : statut commande + livraison
   */
  async getOrderStatus(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { shipment: true },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    return {
      orderId: order.id,
      orderStatus: order.status,
      shipmentStatus: order.shipment?.status ?? null,
    };
  }

  /**
   * VENDEUR : commandes liées à ses produits
   */
  async findOrdersForVendor(vendorId: number) {
    return this.prisma.order.findMany({
      where: {
        items: {
          some: {
            variant: {
              product: {
                vendorId: vendorId,
              },
            },
          },
        },
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        address: true,
        shipment: {
          include: {
            events: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * GUEST : création commande
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

  const order = await this.prisma.order.create({
    data: {
      userId: null,
      guestName: dto.guestName,
      guestEmail: dto.guestEmail,
      guestPhone: dto.guestPhone,
      addressId: address.id,
      status: OrderStatus.PENDING,
      totalAmount,
      items: { create: itemsData },
    },
    include: { items: true, address: true },
  });

  // ✅ Création de la facture EN PREMIER
  const invoice = await this.prisma.invoice.create({
    data: {
      orderId: order.id,
      reference: `INV-${Date.now()}`,
      type: 'DIGITAL',
      total: totalAmount,
    },
  });

  // ✅ Données fiables pour le PDF
  const invoiceData = {
    invoiceRef: invoice.reference,
    orderDate: order.createdAt,
    customer: {
      name: order.guestName,
      email: order.guestEmail,
      phone: order.guestPhone,
    },
    items: order.items.map(i => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.unitPrice * i.quantity,
    })),
    subtotal: totalAmount,
    tax: totalAmount * 0.1925,
    total: totalAmount * 1.1925,
  };

  const pdf = await this.invoiceService.generateInvoicePdf(invoiceData);

  if (!order.guestEmail) {
    throw new BadRequestException('Email client manquant');
    }
    
    await this.emailService.sendInvoiceEmail(
      order.guestEmail,
      invoice.reference,
      pdf
    );

  return order;
 }
}
