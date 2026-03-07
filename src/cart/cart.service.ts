import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PromotionService } from '../promotion/promotion.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private promotionService: PromotionService,
  ) {}

  // Récupérer ou créer un panier pour un utilisateur
  async getOrCreateCart(userId: number) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            productVariant: {
              include: { product: true },
            },
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
              productVariant: { include: { product: true } },
            },
          },
        },
      });
    }

    return cart;
  }

  // Récupérer le panier
  async getCart(userId: number) {
    return this.getOrCreateCart(userId);
  }

  // Ajouter un item dans le panier avec promo appliquée
  async addItem(userId: number, dto: AddToCartDto) {
    const cart = await this.getOrCreateCart(userId);

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
      include: { product: true },
    });

    if (!variant) throw new NotFoundException('Product variant not found');
    if (variant.stock < dto.quantity) throw new BadRequestException('Insufficient stock');

    // Vérifier la promo active
    const promo = await this.promotionService.getActivePromotion(variant.productId);
    const finalPrice = this.promotionService.applyPromotion(variant.price, promo);

    // Vérifier si l'item existe déjà
    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: dto.variantId } },
    });

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + dto.quantity,
          unitPrice: finalPrice,
        },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId: dto.variantId,
        quantity: dto.quantity,
        unitPrice: finalPrice,
      },
    });
  }

  // Mettre à jour un item du panier
  async updateItem(userId: number, itemId: number, quantity: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true, productVariant: { include: { product: true } } },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    // Recalculer le prix promo si nécessaire
    const promo = await this.promotionService.getActivePromotion(item.productVariant.productId);
    const finalPrice = this.promotionService.applyPromotion(item.productVariant.price, promo);

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity, unitPrice: finalPrice },
    });
  }

  // Supprimer un item du panier
  async removeItem(userId: number, itemId: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  // Calculer le total du panier avec promotions
  async calculateCartTotal(userId: number) {
    const cart = await this.getOrCreateCart(userId);
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


  /* ===========================
   GET CART RECOMMENDATIONS
   =========================== */
async getCartRecommendations(userId: number) {
  const cart = await this.prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          productVariant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) return [];

  /* -----------------------------
     récupérer les produits du panier
  ----------------------------- */
  const cartProducts = cart.items
    .map((item) => item.productVariant.product)
    .filter((p): p is NonNullable<typeof p> => p !== null); // filtrer les null

  const categoryIds: number[] = cartProducts
    .map((p) => p.categoryId)
    .filter((id): id is number => id !== null);

  const cartProductIds: number[] = cartProducts
    .map((p) => p.id)
    .filter((id): id is number => id !== null);

  /* -----------------------------
     extraire tous les mots titres
  ----------------------------- */
  const words = cartProducts.flatMap((p) =>
    p.title
      .toLowerCase()
      .split(' ')
      .filter((w) => w.length > 2),
  );

  const uniqueWords = [...new Set(words)];

  const titleFilters: Prisma.ProductWhereInput[] = uniqueWords.map((word) => ({
    title: { contains: word, mode: 'insensitive' },
  }));

  /* -----------------------------
     1 seule requête recommandations
  ----------------------------- */
  const recommendations = await this.prisma.product.findMany({
    where: {
      isActive: true,
      id: { notIn: cartProductIds },
      categoryId: { in: categoryIds },
      OR: titleFilters,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      vendor: { select: { id: true, businessName: true } },
      variants: { select: { id: true, name: true, price: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return recommendations;
}
}