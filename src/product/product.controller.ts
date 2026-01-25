// src/product/product.controller.ts
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

import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VendorApprovedGuard } from '../vendor/guards/vendor-approved.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /* ===========================
     🔓 PUBLIC – LIST PRODUCTS
     =========================== */
  @Get()
  async findAllPublic() {
    return this.productService.findAllPublic();
  }

  /* ===========================
     🔓 PUBLIC – PRODUCT DETAIL
     =========================== */
  @Get(':id')
  async findOnePublic(@Param('id') id: string) {
    return this.productService.findOnePublic(Number(id));
  }

  /* ===========================
     🔐 VENDOR (APPROVED) – CREATE
     =========================== */
  @UseGuards(JwtAuthGuard, VendorApprovedGuard)
  @Post()
  async create(
    @Body() dto: CreateProductDto,
    @Req() req: any,
  ) {
    return this.productService.create(
      req.user.vendorId,
      dto,
    );
  }

  /* ===========================
     🔐 VENDOR (APPROVED) – MY PRODUCTS
     =========================== */
  @UseGuards(JwtAuthGuard, VendorApprovedGuard)
  @Get('me')
  async findMyProducts(@Req() req: any) {
    return this.productService.findMyProducts(
      req.user.vendorId,
    );
  }

  /* ===========================
     🔐 VENDOR (APPROVED) – UPDATE
     =========================== */
  @UseGuards(JwtAuthGuard, VendorApprovedGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: any,
  ) {
    return this.productService.update(
      Number(id),
      req.user.vendorId,
      dto,
    );
  }

  /* ===========================
     🔐 VENDOR (APPROVED) – DELETE
     =========================== */
  @UseGuards(JwtAuthGuard, VendorApprovedGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.productService.remove(
      Number(id),
      req.user.vendorId,
    );
  }
}
