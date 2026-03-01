// src/orders/orders.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {OrderStatus} from '@prisma/client';
import { CreateOrderDto } from './dto/create-order-item-dto';
import { EmailService } from '../email/email.service';
import { InvoiceService } from '../invoice/invoice.service';
import { PromotionService } from '../promotion/promotion.service';

@Injectable()
export class OrdersService {
   constructor(
      private readonly prisma: PrismaService,
      private readonly emailService: EmailService,
      private readonly invoiceService: InvoiceService,
      private readonly promotionService: PromotionService,
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
   * GUEST : création commande AVEC PROMOTIONS
   */
  async createGuestOrder(dto: CreateOrderDto) {
    console.log('📦 Création de commande pour:', dto.guestEmail);

    let totalAmount = 0;
    const itemsData: {
      variantId: number;
      name: string;
      unitPrice: number;
      quantity: number;
      promotionApplied: boolean;
      originalUnitPrice: number | null;
    }[] = [];

    // ✅ Calcul avec promotions
    for (const item of dto.items) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });

      if (!variant) {
        throw new NotFoundException(`Variant ${item.variantId} introuvable`);
      }

      // ✅ Vérifier s'il y a une promotion active
      const promo = await this.promotionService.getActivePromotion(
        variant.productId,
      );

      const originalPrice = variant.price;
      const unitPrice = this.promotionService.applyPromotion(
        originalPrice,
        promo,
      );

      totalAmount += unitPrice * item.quantity;

      itemsData.push({
        variantId: variant.id,
        name: variant.product.title,
        unitPrice,
        quantity: item.quantity,
        promotionApplied: promo ? true : false,
        originalUnitPrice: promo ? originalPrice : null,
      });
    }

    console.log('💰 Total calculé:', totalAmount);

    // Création adresse
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

    console.log('📍 Adresse créée:', address.id);

    // Création commande
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
          create: itemsData.map(item => ({
            variantId: item.variantId,
            name: item.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true, address: true },
    });

    console.log('✅ Commande créée:', order.id);

    // Création facture
    const invoice = await this.prisma.invoice.create({
      data: {
        orderId: order.id,
        reference: `INV-${Date.now()}`,
        type: 'DIGITAL',
        total: totalAmount,
      },
    });

    console.log('📄 Facture créée:', invoice.reference);

    // ✅ Envoi de la facture par email
    try {
      if (!order.guestEmail) {
        throw new BadRequestException('Email client manquant');
      }

      const invoiceData = {
        invoiceRef: invoice.reference,
        orderDate: order.createdAt,
        customer: {
          name: order.guestName,
          email: order.guestEmail,
          phone: order.guestPhone,
        },
        items: order.items.map((i, index) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.unitPrice * i.quantity,
          promotionApplied: itemsData[index]?.promotionApplied || false,
          originalUnitPrice: itemsData[index]?.originalUnitPrice || null,
        })),
        subtotal: totalAmount,
        total: totalAmount, // ✅ Pas de TVA
      };

      console.log('📧 Génération et envoi de la facture...');
      const pdf = await this.invoiceService.generateInvoicePdf(invoiceData);

      await this.emailService.sendInvoiceEmail(
        order.guestEmail,
        invoice.reference,
        pdf
      );

      console.log('✅ Email de facture envoyé avec succès');

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la facture:', error);
      console.error('⚠️ La commande a été créée mais l\'email n\'a pas pu être envoyé');
    }

    return order;
  }

  /**
   * USER CONNECTÉ : création commande AVEC PROMOTIONS
   */
  async createAuthenticatedUserOrder(userId: number, dto: CreateOrderDto) {
    console.log('📦 Création de commande pour utilisateur:', userId);

    let totalAmount = 0;
    const itemsData: {
      variantId: number;
      name: string;
      unitPrice: number;
      quantity: number;
      promotionApplied: boolean;
      originalUnitPrice: number | null;
    }[] = [];

    // ✅ Calcul avec promotions
    for (const item of dto.items) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });

      if (!variant) {
        throw new NotFoundException(`Variant ${item.variantId} introuvable`);
      }

      // ✅ Vérifier s'il y a une promotion active
      const promo = await this.promotionService.getActivePromotion(
        variant.productId,
      );

      const originalPrice = variant.price;
      const unitPrice = this.promotionService.applyPromotion(
        originalPrice,
        promo,
      );

      totalAmount += unitPrice * item.quantity;

      itemsData.push({
        variantId: variant.id,
        name: variant.product.title,
        unitPrice,
        quantity: item.quantity,
        promotionApplied: promo ? true : false,
        originalUnitPrice: promo ? originalPrice : null,
      });
    }

    console.log('💰 Total calculé:', totalAmount);

    // Récupérer l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Création adresse
    const address = await this.prisma.address.create({
      data: {
        userId: userId,
        fullName: dto.address.fullName,
        phone: dto.address.phone,
        addressLine: dto.address.addressLine,
        city: dto.address.city,
        country: dto.address.country,
      },
    });

    console.log('📍 Adresse créée:', address.id);

    // Création commande
    const order = await this.prisma.order.create({
      data: {
        userId: userId,
        addressId: address.id,
        status: OrderStatus.PENDING,
        totalAmount,
        items: {
          create: itemsData.map(item => ({
            variantId: item.variantId,
            name: item.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true, address: true },
    });

    console.log('✅ Commande créée:', order.id);

    // Création facture
    const invoice = await this.prisma.invoice.create({
      data: {
        orderId: order.id,
        reference: `INV-${Date.now()}`,
        type: 'DIGITAL',
        total: totalAmount,
      },
    });

    console.log('📄 Facture créée:', invoice.reference);

    // ✅ Envoi de la facture par email
    try {
      if (!user.email) {
        throw new BadRequestException('Email utilisateur manquant');
      }

      const invoiceData = {
        invoiceRef: invoice.reference,
        orderDate: order.createdAt,
        customer: {
          name: user.username,
          email: user.email,
          phone: user.phone || 'N/A',
        },
        items: order.items.map((i, index) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.unitPrice * i.quantity,
          promotionApplied: itemsData[index]?.promotionApplied || false,
          originalUnitPrice: itemsData[index]?.originalUnitPrice || null,
        })),
        subtotal: totalAmount,
        total: totalAmount, // ✅ Pas de TVA
      };

      console.log('📧 Génération et envoi de la facture...');
      const pdf = await this.invoiceService.generateInvoicePdf(invoiceData);

      await this.emailService.sendInvoiceEmail(
        user.email,
        invoice.reference,
        pdf
      );

      console.log('✅ Email de facture envoyé avec succès');

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la facture:', error);
      console.error('⚠️ La commande a été créée mais l\'email n\'a pas pu être envoyé');
    }

    return order;
  }
}
