import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CheckoutService {
  constructor(private prisma: PrismaService) {}

  async quote(userId: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            productVariant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    let subtotal = 0;

    const items = cart.items.map((item) => {
      if (item.productVariant.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.productVariant.name}`,
        );
      }

      const total = item.unitPrice * item.quantity;
      subtotal += total;

      return {
        variantId: item.variantId,
        name: item.productVariant.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total,
      };
    });

    return {
      items,
      subtotal,
      total: subtotal,
    };
  }

  async confirmCheckout(userId: number, addressId: number) {
  const cart = await this.prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          productVariant: true, // ✅ nom exact du schéma
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new BadRequestException('Panier vide');
  }

  const address = await this.prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    throw new NotFoundException('Adresse introuvable');
  }

  return this.prisma.$transaction(async (tx) => {
    let totalAmount = 0;

    for (const item of cart.items) {
      if (item.quantity > item.productVariant.stock) {
        throw new BadRequestException(
          `Stock insuffisant pour ${item.productVariant.name}`,
        );
      }

      totalAmount += item.unitPrice * item.quantity;
    }

    const order = await tx.order.create({
      data: {
        userId,
        addressId,
        totalAmount,
        items: {
          create: cart.items.map((item) => ({
            name: item.productVariant.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            variantId: item.variantId,
          })),
        },
      },
    });

    for (const item of cart.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return order;
  });
}


  findMyOrders(userId: number) {
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

  findOneMyOrder(orderId: number, userId: number) {
    return this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: true,
        address: true,
      },
    });
  }

}
