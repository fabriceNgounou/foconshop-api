import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PromotionService } from '../promotion/promotion.service';

@Injectable()
export class CheckoutService {
  constructor(
    private prisma: PrismaService,
    private promotionService: PromotionService,
  ) {}

  // Obtenir un devis du panier avec promotions
  async quote(userId: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { productVariant: { include: { product: true } } } } },
    });

    if (!cart || cart.items.length === 0) throw new BadRequestException('Cart is empty');

    let subtotal = 0;

    const items = await Promise.all(
      cart.items.map(async (item) => {
        if (item.productVariant.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${item.productVariant.name}`);
        }

        const promo = await this.promotionService.getActivePromotion(item.productVariant.productId);
        const finalUnitPrice = this.promotionService.applyPromotion(item.unitPrice, promo);
        const total = finalUnitPrice * item.quantity;
        subtotal += total;

        return {
          variantId: item.variantId,
          name: item.productVariant.name,
          quantity: item.quantity,
          unitPrice: finalUnitPrice,
          total,
          promotionApplied: promo ? true : false,
        };
      }),
    );

    return { items, subtotal, total: subtotal };
  }

  // Confirmer la commande
  async confirmCheckout(userId: number, addressId: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { productVariant: { include: { product: true } } } } },
    });

    if (!cart || cart.items.length === 0) throw new BadRequestException('Cart is empty');

    const address = await this.prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new NotFoundException('Address not found');

    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;

      const orderItemsData = cart.items.map((item) => {
        if (item.quantity > item.productVariant.stock) {
          throw new BadRequestException(`Insufficient stock for ${item.productVariant.name}`);
        }

        const total = item.unitPrice * item.quantity;
        totalAmount += total;

        return {
          variantId: item.variantId,
          name: item.productVariant.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        };
      });

      const order = await tx.order.create({
        data: { userId, addressId, totalAmount, items: { create: orderItemsData } },
      });

      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });
  }

  // Récupérer mes commandes
  findMyOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true, address: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Récupérer une commande spécifique
  findOneMyOrder(orderId: number, userId: number) {
    return this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true, address: true },
    });
  }
}