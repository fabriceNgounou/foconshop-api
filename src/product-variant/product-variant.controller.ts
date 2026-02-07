import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ProductVariantService } from './product-variant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Controller('products/:productId/variants')
export class ProductVariantController {
  constructor(private readonly service: ProductVariantService) {}

  /* 🔓 PUBLIC – LIST VARIANTS */
  @Get()
  findByProduct(@Param('productId') productId: string) {
    return this.service.findByProduct(Number(productId));
  }

  /* 🔐 VENDOR – CREATE VARIANT */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Post()
  create(
    @Param('productId') productId: string,
    @Body() dto: CreateProductVariantDto,
    @Req() req: any,
  ) {
    return this.service.create(
      Number(productId),
      req.user.vendorId,
      dto,
    );
  }

  /* 🔐 VENDOR – UPDATE VARIANT */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Patch(':variantId')
  update(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateProductVariantDto,
    @Req() req: any,
  ) {
    return this.service.update(
      Number(variantId),
      req.user.vendorId,
      dto,
    );
  }

  /* 🔐 VENDOR – DELETE VARIANT */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Delete(':variantId')
  remove(
    @Param('variantId') variantId: string,
    @Req() req: any,
  ) {
    return this.service.remove(
      Number(variantId),
      req.user.vendorId,
    );
  }
}
