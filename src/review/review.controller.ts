// src/reviews/reviews.controller.ts
import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Body,
  Req,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ReviewsService } from './review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /* ========================================================================== */
  /*                         RATINGS PRODUITS                                   */
  /* ========================================================================== */

  /**
   * Noter un produit
   * POST /reviews/ratings/:productId
   */
  @UseGuards(JwtAuthGuard)
  @Post('ratings/:productId')
  createRating(
    @Req() req: any,
    @Param('productId', ParseIntPipe) productId: number,
    @Body('value') value: number,
  ) {
    return this.reviewsService.createRating(req.user.sub, productId, value);
  }

  /**
   * Modifier une note
   * PATCH /reviews/ratings/:id
   */
  @UseGuards(JwtAuthGuard)
  @Patch('ratings/:id')
  updateRating(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('value') value: number,
  ) {
    return this.reviewsService.updateRating(req.user.sub, id, value);
  }

  /**
   * Obtenir les notes d'un produit
   * GET /reviews/ratings/product/:productId
   */
  @Get('ratings/product/:productId')
  getProductRatings(@Param('productId', ParseIntPipe) productId: number) {
    return this.reviewsService.getProductRatings(productId);
  }

  /* ========================================================================== */
  /*                         RATINGS VENDEURS                                   */
  /* ========================================================================== */

  /**
   * Noter un vendeur
   * POST /reviews/vendors/:vendorId/rate
   */
  @UseGuards(JwtAuthGuard)
  @Post('vendors/:vendorId/rate')
  rateVendor(
    @Req() req: any,
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Body('value') value: number,
  ) {
    return this.reviewsService.rateVendor(req.user.sub, vendorId, value);
  }

  /**
   * Obtenir les notes d'un vendeur
   * GET /reviews/vendors/:vendorId/ratings
   */
  @Get('vendors/:vendorId/ratings')
  getVendorRatings(@Param('vendorId', ParseIntPipe) vendorId: number) {
    return this.reviewsService.getVendorRatings(vendorId);
  }

  /* ========================================================================== */
  /*                         RATINGS COMMANDES                                  */
  /* ========================================================================== */

  /**
   * Noter une commande
   * POST /reviews/orders/:orderId/rate
   */
  @UseGuards(JwtAuthGuard)
  @Post('orders/:orderId/rate')
  rateOrder(
    @Req() req: any,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body('value') value: number,
  ) {
    return this.reviewsService.rateOrder(req.user.sub, orderId, value);
  }

  /**
   * Obtenir la note d'une commande
   * GET /reviews/orders/:orderId/rating
   */
  @Get('orders/:orderId/rating')
  getOrderRating(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.reviewsService.getOrderRating(orderId);
  }

  /* ========================================================================== */
  /*                         REVIEWS (COMMENTAIRES)                             */
  /* ========================================================================== */

  /**
   * Créer un commentaire sur un produit
   * POST /reviews/product/:productId
   */
  @UseGuards(JwtAuthGuard)
  @Post('product/:productId')
  createReview(
    @Req() req: any,
    @Param('productId', ParseIntPipe) productId: number,
    @Body('comment') comment: string,
  ) {
    return this.reviewsService.createReview(req.user.sub, productId, comment);
  }

  /**
   * Supprimer un commentaire
   * DELETE /reviews/:id
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteReview(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reviewsService.deleteReview(req.user.sub, id);
  }

  /**
   * Obtenir les commentaires d'un produit
   * GET /reviews/product/:productId
   */
  @Get('product/:productId')
  getProductReviews(
    @Param('productId', ParseIntPipe) productId: number,
    @Query('sort') sort?: string,
  ) {
    return this.reviewsService.getProductReviews(productId, sort);
  }
}