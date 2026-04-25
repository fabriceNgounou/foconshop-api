import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PromotionService } from '../promotion/promotion.service';

@Injectable()
export class CheckoutService {
  constructor(
    private prisma: PrismaService,
    private promotionService: PromotionService,
  ) {}

  // =========================
  // 🧠 LOGIQUE CENTRALISÉE
  // =========================
  private async buildCheckoutData(cart: any, address: any) {
    let subtotal = 0;
    let maxDeliveryFee = 0;

    let deliveryType: 'INTRA_CITY' | 'INTER_CITY' = 'INTRA_CITY';
    let vendorCity = '';

    const items: any[] = [];

    for (const item of cart.items) {
      const variant = item.productVariant;

      if (!variant) {
        throw new NotFoundException('Variant introuvable');
      }

      if (variant.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuffisant pour ${variant.name}`,
        );
      }

      const vendor = variant.product?.vendor;

      if (!vendor) {
        throw new NotFoundException(
          'Vendor introuvable pour ce produit',
        );
      }

      // 🔥 PROMO (aligné avec OrderService)
      const promo = await this.promotionService.getActivePromotion(
        variant.productId,
      );

      const originalPrice = variant.price;

      const unitPrice = this.promotionService.applyPromotion(
        originalPrice,
        promo,
      );

      const total = unitPrice * item.quantity;
      subtotal += total;

      // 🚚 LIVRAISON
      const clientCity = address.city.toLowerCase().trim();
      const vendorCityNormalized = vendor.city.toLowerCase().trim();

      const isSameCity = clientCity === vendorCityNormalized;

      const fee = isSameCity
        ? variant.intraCityDeliveryFee
        : variant.interCityDeliveryFee;

      if (fee > maxDeliveryFee) {
        maxDeliveryFee = fee;
      }

      if (!isSameCity) {
        deliveryType = 'INTER_CITY';
      }

      if (!vendorCity) {
        vendorCity = vendor.city;
      }

      items.push({
        variantId: variant.id,
        name: variant.name,
        quantity: item.quantity,
        unitPrice,
        originalUnitPrice: promo ? originalPrice : null,
        total,
        deliveryFee: fee,
        promotionApplied: !!promo,
      });
    }

    return {
      items,
      subtotal,
      deliveryFee: maxDeliveryFee,
      total: subtotal + maxDeliveryFee,
      deliveryType,
      deliveryCity: address.city,
      vendorCity,
    };
  }

  // =========================
  // 📊 QUOTE
  // =========================
  async quote(userId: number, addressId: number) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Adresse introuvable');
    }

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  include: {
                    vendor: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    return this.buildCheckoutData(cart, address);
  }

  // =========================
  // ✅ CONFIRM CHECKOUT
  // =========================
  async confirmCheckout(userId: number, addressId: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  include: {
                    vendor: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Adresse introuvable');
    }

    const checkoutData = await this.buildCheckoutData(cart, address);

    return this.prisma.$transaction(async (tx) => {
      // 🧾 CREATE ORDER
      const order = await tx.order.create({
        data: {
          userId,
          addressId,

          // ✅ champs obligatoires Prisma
          subtotal: checkoutData.subtotal,
          deliveryFee: checkoutData.deliveryFee,
          totalAmount: checkoutData.total,
          deliveryType: checkoutData.deliveryType,
          deliveryCity: checkoutData.deliveryCity,
          vendorCity: checkoutData.vendorCity,

          items: {
            create: checkoutData.items.map((item) => ({
              variantId: item.variantId,
              name: item.name,
              unitPrice: item.unitPrice,
              originalUnitPrice: item.originalUnitPrice,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: true,
          address: true,
        },
      });

      // 📦 UPDATE STOCK
      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      // 🧹 CLEAR CART
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });
  }


  
}