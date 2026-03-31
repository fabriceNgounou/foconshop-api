import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                               CREATE RATING                                */
  /* -------------------------------------------------------------------------- */

  async createRating(userId: number, productId: number, value: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: true },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }

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
        title: 'Nouvelle note',
        message: `Votre produit "${product.title}" a reçu une note`,
        type: NotificationType.NEW_RATING,
      });
    }

    return rating;
  }

  /* -------------------------------------------------------------------------- */
  /*                               UPDATE RATING                                */
  /* -------------------------------------------------------------------------- */

  async updateRating(userId: number, ratingId: number, value: number) {
    const rating = await this.prisma.rating.findUnique({
      where: { id: ratingId },
    });

    if (!rating || rating.userId !== userId) {
      throw new NotFoundException('Rating introuvable');
    }

    return this.prisma.rating.update({
      where: { id: ratingId },
      data: { value },
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                               CREATE REVIEW                                */
  /* -------------------------------------------------------------------------- */

  async createReview(
    userId: number,
    productId: number,
    content: string,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: true },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }

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

  /* -------------------------------------------------------------------------- */
  /*                               DELETE REVIEW                                */
  /* -------------------------------------------------------------------------- */

  async deleteReview(userId: number, reviewId: number) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.userId !== userId) {
      throw new NotFoundException('Review introuvable');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    return { message: 'Review supprimée' };
  }

  /* -------------------------------------------------------------------------- */
  /*                             PRODUCT RATINGS                                */
  /* -------------------------------------------------------------------------- */

  async getProductRatings(productId: number) {
    const ratings = await this.prisma.rating.findMany({
      where: { productId },
    });

    const total = ratings.length;

    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratings.forEach((r) => {
      distribution[r.value]++;
    });

    const avg =
      total > 0
        ? ratings.reduce((sum, r) => sum + r.value, 0) / total
        : 0;

    return {
      count: total,
      average: Number(avg.toFixed(2)),
      distribution,
      ratings,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                             PRODUCT REVIEWS                                */
  /* -------------------------------------------------------------------------- */

  async getProductReviews(productId: number, sort?: string) {
    let orderBy: any = { createdAt: 'desc' };

    if (sort === 'best') {
      orderBy = { createdAt: 'asc' }; // simple fallback
    }

    return this.prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy,
    });
  }
}