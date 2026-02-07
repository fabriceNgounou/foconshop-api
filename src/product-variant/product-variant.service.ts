import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Injectable()
export class ProductVariantService {
  constructor(private prisma: PrismaService) {}

  // 🔐 Vendor – create variant for his product
  async create(
    productId: number,
    vendorId: number,
    dto: CreateProductVariantDto,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.vendorId !== vendorId) {
      throw new ForbiddenException('Not your product');
    }

    return this.prisma.productVariant.create({
      data: {
        productId,
        name: dto.name,
        price: dto.price,
        stock: dto.stock,
      },
    });
  }

  // 🔓 Public – list variants of a product
  async findByProduct(productId: number) {
    return this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // 🔐 Vendor – update variant
  async update(
    variantId: number,
    vendorId: number,
    dto: UpdateProductVariantDto,
  ) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    if (variant.product.vendorId !== vendorId) {
      throw new ForbiddenException('Not your product');
    }

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: dto,
    });
  }

  // 🔐 Vendor – delete variant
  async remove(variantId: number, vendorId: number) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    if (variant.product.vendorId !== vendorId) {
      throw new ForbiddenException('Not your product');
    }

    return this.prisma.productVariant.delete({
      where: { id: variantId },
    });
  }
}
