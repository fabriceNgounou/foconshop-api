// src/media/media.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaType } from '@prisma/client';
import { join } from 'path';
import * as fs from 'fs';

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

  // =========================
  // 🔁 UPDATE MEDIA
  // =========================
  async updateProductMedia(
    mediaId: number,
    vendorId: number,
    newUrl: string,
    newType: MediaType,
  ) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      include: { product: true },
    });

    if (!media) {
      throw new NotFoundException('Média introuvable');
    }

    if (media.product.vendorId !== vendorId) {
      throw new ForbiddenException('Accès refusé à ce média');
    }

    // supprimer ancien fichier
    const oldPath = join(process.cwd(), media.url);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }

    return this.prisma.media.update({
      where: { id: mediaId },
      data: {
        url: newUrl,
        type: newType,
      },
    });
  }

  // =========================
  // 🗑️ DELETE MEDIA
  // =========================
  async deleteProductMedia(mediaId: number, vendorId: number) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      include: { product: true },
    });

    if (!media) {
      throw new NotFoundException('Média introuvable');
    }

    if (media.product.vendorId !== vendorId) {
      throw new ForbiddenException('Accès refusé à ce média');
    }

    const filePath = join(process.cwd(), media.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.prisma.media.delete({
      where: { id: mediaId },
    });

    return { message: 'Média supprimé avec succès' };
  }

  async findByProduct(productId: number) {
    return this.prisma.media.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
