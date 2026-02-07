// src/media/media.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaType } from '@prisma/client';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async addProductMedia(
    productId: number,
    vendorId: number,
    url: string,
    type: MediaType,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }

    if (product.vendorId !== vendorId) {
      throw new ForbiddenException('Accès refusé à ce produit');
    }

    return this.prisma.media.create({
      data: {
        productId,
        url,
        type,
      },
    });
  }

  async findByProduct(productId: number) {
    return this.prisma.media.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
