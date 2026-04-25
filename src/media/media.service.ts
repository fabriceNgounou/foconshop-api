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

  /* -------------------------------------------------------------------------- */
  /*                              PRODUCT MEDIA                                 */
  /* -------------------------------------------------------------------------- */

  async addProductMedia(
    productId: number,
    vendorId: number,
    url: string,
    type: MediaType,
    fileSize: number,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) throw new NotFoundException('Produit introuvable');
    if (product.vendorId !== vendorId)
      throw new ForbiddenException('Accès refusé');

    const mediaCount = await this.prisma.media.count({
      where: { productId },
    });

    if (mediaCount >= 6) {
      throw new ForbiddenException('Max 6 médias par produit');
    }

    this.validateFile(type, fileSize);

    return this.prisma.media.create({
      data: { productId, url, type },
    });
  }

  async updateProductMedia(
    mediaId: number,
    vendorId: number,
    newUrl: string,
    newType: MediaType,
    fileSize: number,
  ) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      include: { product: true },
    });

    if (!media) throw new NotFoundException('Média introuvable');
    if (media.product.vendorId !== vendorId)
      throw new ForbiddenException('Accès refusé');

    this.deleteFile(media.url);
    this.validateFile(newType, fileSize);

    return this.prisma.media.update({
      where: { id: mediaId },
      data: { url: newUrl, type: newType },
    });
  }

  async deleteProductMedia(mediaId: number, vendorId: number) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      include: { product: true },
    });

    if (!media) throw new NotFoundException('Média introuvable');
    if (media.product.vendorId !== vendorId)
      throw new ForbiddenException('Accès refusé');

    this.deleteFile(media.url);

    await this.prisma.media.delete({ where: { id: mediaId } });

    return { message: 'Média supprimé' };
  }

  async findByProduct(productId: number) {
    return this.prisma.media.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                              VARIANT MEDIA ⭐                               */
  /* -------------------------------------------------------------------------- */

  async addVariantMedia(
    variantId: number,
    vendorId: number,
    url: string,
    type: MediaType,
    fileSize: number,
  ) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) throw new NotFoundException('Variant introuvable');

    if (variant.product.vendorId !== vendorId)
      throw new ForbiddenException('Accès refusé');

    this.validateFile(type, fileSize);

    return this.prisma.media.create({
      data: {
        variantId,
        productId: variant.productId,
        url,
        type,
      },
    });
  }

  async updateVariantMedia(
    mediaId: number,
    vendorId: number,
    newUrl: string,
    newType: MediaType,
    fileSize: number,
  ) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        variant: {
          include: { product: true },
        },
      },
    });

    if (!media || !media.variant)
      throw new NotFoundException('Média variant introuvable');

    if (media.variant.product.vendorId !== vendorId)
      throw new ForbiddenException('Accès refusé');

    this.deleteFile(media.url);
    this.validateFile(newType, fileSize);

    return this.prisma.media.update({
      where: { id: mediaId },
      data: {
        url: newUrl,
        type: newType,
      },
    });
  }

  async deleteVariantMedia(mediaId: number, vendorId: number) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        variant: {
          include: { product: true },
        },
      },
    });

    if (!media || !media.variant)
      throw new NotFoundException('Média variant introuvable');

    if (media.variant.product.vendorId !== vendorId)
      throw new ForbiddenException('Accès refusé');

    this.deleteFile(media.url);

    await this.prisma.media.delete({ where: { id: mediaId } });

    return { message: 'Média variant supprimé' };
  }

  async findByVariant(variantId: number) {
    return this.prisma.media.findMany({
      where: { variantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                              HELPERS                                       */
  /* -------------------------------------------------------------------------- */

  private validateFile(type: MediaType, size: number) {
    if (type === MediaType.IMAGE && size > 1 * 1024 * 1024) {
      throw new ForbiddenException('Image > 1Mo interdite');
    }

    if (type === MediaType.VIDEO && size > 4 * 1024 * 1024) {
      throw new ForbiddenException('Vidéo > 4Mo interdite');
    }
  }

  private deleteFile(path: string) {
    const filePath = join(process.cwd(), path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
