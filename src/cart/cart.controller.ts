// src/cart/cart.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getMyCart(@Req() req: any) {
    return this.cartService.getCart(req.user.sub);
  }

  @Post('items')
  addItem(@Req() req: any, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(req.user.sub, dto);
  }

  @Patch('items/:id')
  updateItem(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(
      req.user.sub,
      Number(id),
      dto.quantity,
    );
  }

  @Delete('items/:id')
  removeItem(@Req() req: any, @Param('id') id: string) {
    return this.cartService.removeItem(req.user.sub, Number(id));
  }
}
