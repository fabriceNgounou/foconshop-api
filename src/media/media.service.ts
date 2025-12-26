// src/media/media.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async addProductImage(
    productId: number,
    vendorId: number,
    filePath: string,
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

    return this.prisma.media.create({
      data: {
        productId,
        url: filePath,
        type: 'IMAGE',
      },
    });
  }

  // 🔓 Public – list images of a product
  async findByProduct(productId: number) {
    return this.prisma.media.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
