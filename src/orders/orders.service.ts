import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, DeliveryType } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order-item-dto';
import { EmailService } from '../email/email.service';
import { InvoiceService } from '../invoice/invoice.service';
import { PromotionService } from '../promotion/promotion.service';
import { NotificationService } from '../notifications/notification.service'; // ✅ AJOUT

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly invoiceService: InvoiceService,
    private readonly promotionService: PromotionService,
    private readonly notificationService: NotificationService, // ✅ AJOUT
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                               GET ORDERS                                   */
  /* -------------------------------------------------------------------------- */

  async findMyOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true, address: true, shipment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

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

  /* -------------------------------------------------------------------------- */
  /*                          LOGIQUE COMMUNE                                   */
  /* -------------------------------------------------------------------------- */

  private async buildOrderData(dto: CreateOrderDto) {
    let subtotal = 0;
    let maxDeliveryFee = 0;

    let deliveryType: DeliveryType = DeliveryType.INTRA_CITY;
    let vendorCity = '';

    const itemsData: any[] = [];

    for (const item of dto.items) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: {
          product: {
            include: { vendor: true },
          },
        },
      });

      if (!variant) {
        throw new NotFoundException(
          `Variant ${item.variantId} introuvable`,
        );
      }

      if (!variant.product.vendor) {
        throw new BadRequestException('Vendor introuvable');
      }

      const promo = await this.promotionService.getActivePromotion(
        variant.productId,
      );

      const originalPrice = variant.price;

      const unitPrice = this.promotionService.applyPromotion(
        originalPrice,
        promo,
      );

      subtotal += unitPrice * item.quantity;

      const clientCity = dto.address.city.toLowerCase().trim();
      const sellerCity = variant.product.vendor.city.toLowerCase().trim();

      const isSameCity = clientCity === sellerCity;

      const fee = isSameCity
        ? variant.intraCityDeliveryFee
        : variant.interCityDeliveryFee;

      if (fee > maxDeliveryFee) {
        maxDeliveryFee = fee;
      }

      if (!isSameCity) {
        deliveryType = DeliveryType.INTER_CITY;
      }

      if (!vendorCity) {
        vendorCity = variant.product.vendor.city;
      }

      itemsData.push({
        variantId: variant.id,
        name: variant.product.title,
        unitPrice,
        originalUnitPrice: promo ? originalPrice : null,
        quantity: item.quantity,
      });
    }

    const totalAmount = subtotal + maxDeliveryFee;

    return {
      subtotal,
      deliveryFee: maxDeliveryFee,
      totalAmount,
      deliveryType,
      vendorCity,
      itemsData,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                              GUEST ORDER                                   */
  /* -------------------------------------------------------------------------- */

  async createGuestOrder(dto: CreateOrderDto) {
    const orderData = await this.buildOrderData(dto);

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

        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee,
        totalAmount: orderData.totalAmount,
        deliveryType: orderData.deliveryType,
        deliveryCity: dto.address.city,
        vendorCity: orderData.vendorCity,

        items: {
          create: orderData.itemsData,
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
      },
    });

    await this.handleInvoiceAndEmail(order, dto.guestEmail);

    try {
      await this.notificationService.notifyNewOrder(order);
    } catch (error) {
      console.error('Notification error:', error);
    }

    return order;
  }

  /* -------------------------------------------------------------------------- */
  /*                         AUTH USER ORDER                                    */
  /* -------------------------------------------------------------------------- */

  async createAuthenticatedUserOrder(
    userId: number,
    dto: CreateOrderDto,
  ) {
    const orderData = await this.buildOrderData(dto);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const address = await this.prisma.address.create({
      data: {
        userId,
        fullName: dto.address.fullName,
        phone: dto.address.phone,
        addressLine: dto.address.addressLine,
        city: dto.address.city,
        country: dto.address.country,
      },
    });

    const order = await this.prisma.order.create({
      data: {
        userId,
        addressId: address.id,
        status: OrderStatus.PENDING,

        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee,
        totalAmount: orderData.totalAmount,
        deliveryType: orderData.deliveryType,
        deliveryCity: dto.address.city,
        vendorCity: orderData.vendorCity,

        items: {
          create: orderData.itemsData,
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
      },
    });

    await this.handleInvoiceAndEmail(order, user.email);

    try {
      await this.notificationService.notifyNewOrder(order);
    } catch (error) {
      console.error('Notification error:', error);
    }

    return order;
  }

  /* -------------------------------------------------------------------------- */
  /*                          FACTURE + EMAIL                                   */
  /* -------------------------------------------------------------------------- */

  private async handleInvoiceAndEmail(order: any, email?: string) {
    const invoice = await this.prisma.invoice.create({
      data: {
        orderId: order.id,
        reference: `INV-${Date.now()}`,
        type: 'DIGITAL',
        total: order.totalAmount,
      },
    });

    try {
      if (!email) {
        throw new BadRequestException('Email manquant');
      }

      const invoiceData = {
        invoiceRef: invoice.reference,
        orderDate: order.createdAt,
        customer: {
          name: order.guestName || 'Client',
          email,
          phone: order.guestPhone || 'N/A',
        },
        items: order.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.unitPrice * i.quantity,
          promotionApplied: !!i.originalUnitPrice,
          originalUnitPrice: i.originalUnitPrice,
        })),
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        totalAmount: order.totalAmount,
      };

      const pdf = await this.invoiceService.generateInvoicePdf(
        invoiceData,
      );

      await this.emailService.sendInvoiceEmail(
        email,
        invoice.reference,
        pdf,
      );
    } catch (error) {
      console.error('Erreur envoi facture:', error);
    }
  }


  /* -------------------------------------------------------------------------- */
/*                    UPDATE STATUS CENTRALISÉ (CORE)                         */
/* -------------------------------------------------------------------------- */

async updateOrderStatus(
  orderId: number,
  newStatus: OrderStatus,
  options?: {
    userId?: number;
    vendorId?: number;
    isAdmin?: boolean;
  },
) {
  const { userId, vendorId, isAdmin } = options || {};

  // 1️⃣ Récupération + sécurisation (CLIENT + VENDOR dans UNE SEULE requête)
  const order = await this.prisma.order.findFirst({
    where: {
      id: orderId,
      ...(userId && !isAdmin ? { userId } : {}),
      ...(vendorId && !isAdmin
        ? {
            items: {
              some: {
                variant: {
                  product: {
                    vendorId,
                  },
                },
              },
            },
          }
        : {}),
    },
    include: {
      items: {
        select: {
          variantId: true,
          quantity: true,
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundException('Commande introuvable');
  }

  // 2️⃣ Protection anti double traitement
  if (order.status === newStatus) {
    throw new BadRequestException(
      `La commande est déjà ${newStatus}`,
    );
  }

  // 3️⃣ Validation du flux métier
  this.validateStatusTransition(
    order.status,
    newStatus,
    isAdmin ?? false,
  );

  // 4️⃣ CAS ANNULATION → RESTOCK
  if (newStatus === OrderStatus.CANCELLED) {
    return this.cancelOrderWithRestock(order);
  }

  // 5️⃣ UPDATE SIMPLE
  return this.prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
    include: {
      items: true,
      address: true,
      shipment: true,
    },
  });
}


/* -------------------------------------------------------------------------- */
/*                         VALIDATION DU FLUX                                 */
/* -------------------------------------------------------------------------- */

private validateStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  isAdmin: boolean,
) {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: [OrderStatus.CANCELLED, OrderStatus.PAID],
    PAID: [OrderStatus.CANCELLED],
    CANCELLED: [],
  };

  const allowed = transitions[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    throw new BadRequestException(
      `Transition interdite: ${currentStatus} → ${newStatus}`,
    );
  }

  // 🔐 règle critique
  if (
    currentStatus === OrderStatus.PAID &&
    newStatus === OrderStatus.CANCELLED &&
    !isAdmin
  ) {
    throw new BadRequestException(
      'Seul un admin peut annuler une commande payée',
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                         ANNULATION AVEC RESTOCK                            */
/* -------------------------------------------------------------------------- */

private async cancelOrderWithRestock(order: any) {
  if (order.status === OrderStatus.CANCELLED) {
    throw new BadRequestException('Commande déjà annulée');
  }

  return this.prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          stock: { increment: item.quantity },
        },
      });
    }

    return tx.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED },
      include: {
        items: true,
        address: true,
        shipment: true,
      },
    });
  });
}


/* -------------------------------------------------------------------------- */
/*                      MÉTHODES SPÉCIFIQUES PAR RÔLE                         */
/* -------------------------------------------------------------------------- */

// 👤 CLIENT
async cancelOrderByClient(orderId: number, userId: number) {
  return this.updateOrderStatus(orderId, OrderStatus.CANCELLED, {
    userId,
    isAdmin: false,
  });
}

// 🏪 VENDOR
async updateOrderStatusByVendor(
  orderId: number,
  vendorId: number,
  newStatus: OrderStatus,
) {
  if (
    newStatus !== OrderStatus.CANCELLED &&
    newStatus !== OrderStatus.PAID
  ) {
    throw new BadRequestException(
      'Un vendeur peut seulement passer à PAID ou CANCELLED',
    );
  }

  // 🔥 LOG IMPORTANT (paiement cash)
  if (newStatus === OrderStatus.PAID) {
    console.log(
      `💰 Paiement CASH confirmé pour commande ${orderId} par vendor ${vendorId}`,
    );
  }

  return this.updateOrderStatus(orderId, newStatus, {
    vendorId,
    isAdmin: false,
  });
}

// 👑 ADMIN
async updateOrderStatusByAdmin(
  orderId: number,
  newStatus: OrderStatus,
) {
  return this.updateOrderStatus(orderId, newStatus, {
    isAdmin: true,
  });
}
}