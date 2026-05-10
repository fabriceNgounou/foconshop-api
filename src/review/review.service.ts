// src/reviews/review.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType, OrderStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  /* ========================================================================== */
  /*                            RATING PRODUIT                                  */
  /* ========================================================================== */

  async createRating(userId: number, productId: number, value: number) {
    // 1. Vérifier que le produit existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: true },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }

    // ✅ 2. VÉRIFIER QUE L'UTILISATEUR A ACHETÉ CE PRODUIT
    const hasPurchased = await this.hasUserPurchasedProduct(userId, productId);
    if (!hasPurchased) {
      throw new BadRequestException(
        'Vous ne pouvez noter que les produits que vous avez achetés'
      );
    }

    // 3. Vérifier si l'utilisateur a déjà noté ce produit
    const existingRating = await this.prisma.rating.findFirst({
      where: {
        userId,
        productId,
      },
    });

    if (existingRating) {
      throw new BadRequestException(
        'Vous avez déjà noté ce produit. Utilisez la mise à jour.'
      );
    }

    // 4. Créer le rating
    const rating = await this.prisma.rating.create({
      data: {
        userId,
        productId,
        value,
      },
    });

    // 🔔 NOTIFICATION VENDEUR
    if (product.vendor?.id) {
      await this.notificationService.createNotification({
        userId: product.vendor.id,
        title: 'Nouvelle note produit',
        message: `Votre produit "${product.title}" a reçu une note de ${value}/5`,
        type: NotificationType.NEW_RATING,
      });
    }

    return rating;
  }

  /* ========================================================================== */
  /*                            RATING VENDEUR                                  */
  /* ========================================================================== */

  async rateVendor(userId: number, vendorId: number, value: number) {
    // 1. Vérifier que le vendeur existe
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendeur introuvable');
    }

    // ✅ 2. VÉRIFIER QUE L'UTILISATEUR A ACHETÉ CHEZ CE VENDEUR
    const hasPurchased = await this.hasUserPurchasedFromVendor(userId, vendorId);
    if (!hasPurchased) {
      throw new BadRequestException(
        'Vous ne pouvez noter que les vendeurs chez qui vous avez acheté'
      );
    }

    // 3. Vérifier si l'utilisateur a déjà noté ce vendeur
    const existingRating = await this.prisma.rating.findFirst({
      where: {
        userId,
        vendorId,
      },
    });

    if (existingRating) {
      throw new BadRequestException('Vous avez déjà noté ce vendeur');
    }

    // 4. Créer le rating
    const rating = await this.prisma.rating.create({
      data: {
        userId,
        vendorId,
        value,
      },
    });

    // 🔔 NOTIFICATION VENDEUR
    await this.notificationService.createNotification({
      userId: vendor.userId,
      title: 'Nouvelle note vendeur',
      message: `Vous avez reçu une note de ${value}/5 étoiles`,
      type: NotificationType.NEW_RATING,
    });

    return rating;
  }

  /* ========================================================================== */
  /*                            RATING COMMANDE                                 */
  /* ========================================================================== */

  async rateOrder(userId: number, orderId: number, value: number) {
    // 1. Vérifier que la commande existe et appartient à l'utilisateur
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Cette commande ne vous appartient pas');
    }

    // 2. Vérifier que la commande est payée
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException(
        'Vous ne pouvez noter que les commandes livrées'
      );
    }

    // 3. Vérifier si l'utilisateur a déjà noté cette commande
    const existingRating = await this.prisma.rating.findFirst({
      where: {
        userId,
        orderId,
      },
    });

    if (existingRating) {
      throw new BadRequestException('Vous avez déjà noté cette commande');
    }

    // 4. Créer le rating
    const rating = await this.prisma.rating.create({
      data: {
        userId,
        orderId,
        value,
      },
    });

    return rating;
  }

  /* ========================================================================== */
  /*                            UPDATE RATING                                   */
  /* ========================================================================== */

  async updateRating(userId: number, ratingId: number, value: number) {
    const rating = await this.prisma.rating.findUnique({
      where: { id: ratingId },
    });

    if (!rating) {
      throw new NotFoundException('Note introuvable');
    }

    if (rating.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres notes'
      );
    }

    return this.prisma.rating.update({
      where: { id: ratingId },
      data: { value },
    });
  }

  /* ========================================================================== */
  /*                            CREATE REVIEW                                   */
  /* ========================================================================== */

  async createReview(userId: number, productId: number, content: string) {
    // 1. Vérifier que le produit existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: true },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }

    // ✅ 2. VÉRIFIER QUE L'UTILISATEUR A ACHETÉ CE PRODUIT
    const hasPurchased = await this.hasUserPurchasedProduct(userId, productId);
    if (!hasPurchased) {
      throw new BadRequestException(
        'Vous ne pouvez commenter que les produits que vous avez achetés'
      );
    }

    // 3. Créer le review
    const review = await this.prisma.review.create({
      data: {
        userId,
        productId,
        content,
      },
    });

    // 🔔 NOTIFICATION VENDEUR
    if (product.vendor?.id) {
      await this.notificationService.createNotification({
        userId: product.vendor.id,
        title: 'Nouveau commentaire',
        message: `Nouveau commentaire sur "${product.title}"`,
        type: NotificationType.NEW_REVIEW,
      });
    }

    return review;
  }

  /* ========================================================================== */
  /*                            DELETE REVIEW                                   */
  /* ========================================================================== */

  async deleteReview(userId: number, reviewId: number) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Commentaire introuvable');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres commentaires'
      );
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    return { message: 'Commentaire supprimé avec succès' };
  }

  /* ========================================================================== */
  /*                          GET PRODUCT RATINGS                               */
  /* ========================================================================== */

  async getProductRatings(productId: number) {
    const ratings = await this.prisma.rating.findMany({
      where: { productId },
      select: {
        id: true,
        value: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    const total = ratings.length;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    ratings.forEach((r) => {
      distribution[r.value]++;
    });

    const avg = total > 0 
      ? ratings.reduce((sum, r) => sum + r.value, 0) / total 
      : 0;

    return {
      count: total,
      average: Number(avg.toFixed(2)),
      distribution,
      ratings,
    };
  }

  /* ========================================================================== */
  /*                          GET VENDOR RATINGS                                */
  /* ========================================================================== */

  async getVendorRatings(vendorId: number) {
    const ratings = await this.prisma.rating.findMany({
      where: { vendorId },
      select: {
        id: true,
        value: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    const total = ratings.length;
    const avg = total > 0 
      ? ratings.reduce((sum, r) => sum + r.value, 0) / total 
      : 0;

    return {
      count: total,
      average: Number(avg.toFixed(2)),
      ratings,
    };
  }

  /* ========================================================================== */
  /*                          GET ORDER RATING                                  */
  /* ========================================================================== */

  async getOrderRating(orderId: number) {
    return this.prisma.rating.findFirst({
      where: { orderId },
      select: {
        id: true,
        value: true,
        createdAt: true,
      },
    });
  }

  /* ========================================================================== */
  /*                          GET PRODUCT REVIEWS                               */
  /* ========================================================================== */

  async getProductReviews(productId: number, sort?: string) {
    let orderBy: any = { createdAt: 'desc' };

    if (sort === 'best') {
      orderBy = { createdAt: 'asc' };
    }

    return this.prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy,
    });
  }

  /* ========================================================================== */
  /*                    MÉTHODES PRIVÉES - VÉRIFICATIONS                        */
  /* ========================================================================== */

  /**
   * Vérifier si l'utilisateur a acheté un produit
   */
  private async hasUserPurchasedProduct(
    userId: number,
    productId: number,
  ): Promise<boolean> {
    const order = await this.prisma.order.findFirst({
      where: {
        userId,
        status: OrderStatus.PAID,
        items: {
          some: {
            variant: { productId },
          },
        },
      },
    });
    return !!order;
  }

  /**
   * Vérifier si l'utilisateur a acheté chez un vendeur
   */
  private async hasUserPurchasedFromVendor(
    userId: number,
    vendorId: number,
  ): Promise<boolean> {
    const order = await this.prisma.order.findFirst({
      where: {
        userId,
        status: OrderStatus.PAID,
        items: {
          some: {
            variant: {
              product: { vendorId },
            },
          },
        },
      },
    });
    return !!order;
  }
}