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
} from '@nestjs/common';
import { ReviewsService } from './review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /* ---------------------------- CREATE RATING ---------------------------- */

  @UseGuards(JwtAuthGuard)
  @Post('ratings/:productId')
  createRating(
    @Req() req: any,
    @Param('productId') productId: string,
    @Body('value') value: number,
  ) {
    return this.reviewsService.createRating(
      req.user.id,
      Number(productId),
      value,
    );
  }

  /* ---------------------------- UPDATE RATING ---------------------------- */

  @UseGuards(JwtAuthGuard)
  @Patch('ratings/:id')
  updateRating(
    @Req() req: any,
    @Param('id') id: string,
    @Body('value') value: number,
  ) {
    return this.reviewsService.updateRating(
      req.user.id,
      Number(id),
      value,
    );
  }

  /* ---------------------------- CREATE REVIEW ---------------------------- */

  @UseGuards(JwtAuthGuard)
  @Post('product/:productId')
  createReview(
    @Req() req: any,
    @Param('productId') productId: string,
    @Body('comment') comment: string,
  ) {
    return this.reviewsService.createReview(
      req.user.id,
      Number(productId),
      comment,
    );
  }

  /* ---------------------------- DELETE REVIEW ---------------------------- */

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteReview(@Req() req: any, @Param('id') id: string) {
    return this.reviewsService.deleteReview(
      req.user.id,
      Number(id),
    );
  }

  /* ---------------------------- GET RATINGS ---------------------------- */

  @Get('ratings/product/:productId')
  getRatings(@Param('productId') productId: string) {
    return this.reviewsService.getProductRatings(
      Number(productId),
    );
  }

  /* ---------------------------- GET REVIEWS ---------------------------- */

  @Get('product/:productId')
  getReviews(
    @Param('productId') productId: string,
    @Query('sort') sort?: string,
  ) {
    return this.reviewsService.getProductReviews(
      Number(productId),
      sort,
    );
  }
}