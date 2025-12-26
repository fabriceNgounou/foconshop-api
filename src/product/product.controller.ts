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
  ForbiddenException,
} from '@nestjs/common';

import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';

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
     🔐 VENDOR – CREATE PRODUCT
     =========================== */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Post()
  async create(
    @Body() dto: CreateProductDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user.vendorId) {
      throw new ForbiddenException('Vendor profile not found');
    }

    return this.productService.create(user.vendorId, dto);
  }

  /* ===========================
     🔐 VENDOR – MY PRODUCTS
     =========================== */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Get('me')
  async findMyProducts(@Req() req: any) {
    return this.productService.findMyProducts(req.user.vendorId);
  }

  /* ===========================
     🔐 VENDOR – UPDATE PRODUCT
     =========================== */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
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
     🔐 VENDOR – DELETE PRODUCT
     =========================== */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
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

  // src/product/product.controller.ts

   @Get(':id')
   async findOnePublic(@Param('id') id: string) {
     return this.productService.findOnePublic(Number(id));
   }
   
}
