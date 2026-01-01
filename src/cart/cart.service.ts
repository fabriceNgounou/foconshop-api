// src/cart/cart.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(userId: number) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            productVariant: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              productVariant: true,
            },
          },
        },
      });
    }

    return cart;
  }

  async getCart(userId: number) {
    return this.getOrCreateCart(userId);
  }

  async addItem(userId: number, dto: AddToCartDto) {
    const cart = await this.getOrCreateCart(userId);

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    if (variant.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: dto.variantId,
        },
      },
    });

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + dto.quantity,
        },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId: dto.variantId,
        quantity: dto.quantity,
        unitPrice: variant.price,
      },
    });
  }



  async updateItem(userId: number, itemId: number, quantity: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  async removeItem(userId: number, itemId: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }
}
