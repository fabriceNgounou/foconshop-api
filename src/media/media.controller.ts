
// src/media/media.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VendorApprovedGuard } from '../vendor/guards/vendor-approved.guard';
import { MediaType } from '@prisma/client';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /* -------------------------------------------------------------------------- */
  /*                            CONFIG UPLOAD                                   */
  /* -------------------------------------------------------------------------- */

  private static storage = diskStorage({
    destination: (req, file, cb) => {
      const uploadDir =
        process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      cb(null, uploadDir);
    },
    filename: (_, file, cb) => {
      const uniqueName =
        Date.now() +
        '-' +
        Math.round(Math.random() * 1e9) +
        extname(file.originalname);

      cb(null, uniqueName);
    },
  });

  private getMediaType(file: Express.Multer.File): MediaType {
    if (file.mimetype.startsWith('image/')) return MediaType.IMAGE;
    if (file.mimetype.startsWith('video/')) return MediaType.VIDEO;

    throw new BadRequestException('Type non supporté');
  }

  /* -------------------------------------------------------------------------- */
  /*                            PRODUCT MEDIA                                   */
  /* -------------------------------------------------------------------------- */

  @UseGuards(JwtAuthGuard, VendorApprovedGuard)
  @Post('products/:productId')
  @UseInterceptors(FileInterceptor('file', { storage: MediaController.storage }))
  async uploadProductMedia(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('Fichier requis');

    return this.mediaService.addProductMedia(
      Number(productId),
      req.user.vendorId,
      `/uploads/${file.filename}`,
      this.getMediaType(file),
      file.size,
    );
  }

  @UseGuards(JwtAuthGuard, VendorApprovedGuard)
  @Patch(':mediaId')
  @UseInterceptors(FileInterceptor('file', { storage: MediaController.storage }))
  async updateProductMedia(
    @Param('mediaId') mediaId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('Fichier requis');

    return this.mediaService.updateProductMedia(
      Number(mediaId),
      req.user.vendorId,
      `/uploads/${file.filename}`,
      this.getMediaType(file),
      file.size,
    );
  }

  @UseGuards(JwtAuthGuard, VendorApprovedGuard)
  @Delete(':mediaId')
  deleteProductMedia(@Param('mediaId') id: string, @Req() req: any) {
    return this.mediaService.deleteProductMedia(
      Number(id),
      req.user.vendorId,
    );
  }

  @Get('products/:productId')
  findByProduct(@Param('productId') id: string) {
    return this.mediaService.findByProduct(Number(id));
  }

  /* -------------------------------------------------------------------------- */
  /*                            VARIANT MEDIA                               */
  /* -------------------------------------------------------------------------- */

  @UseGuards(JwtAuthGuard, VendorApprovedGuard)
  @Post('variants/:variantId')
  @UseInterceptors(FileInterceptor('file', { storage: MediaController.storage }))
  async uploadVariantMedia(
    @Param('variantId') variantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('Fichier requis');

    return this.mediaService.addVariantMedia(
      Number(variantId),
      req.user.vendorId,
      `/uploads/${file.filename}`,
      this.getMediaType(file),
      file.size,
    );
  }

  @UseGuards(JwtAuthGuard, VendorApprovedGuard)
  @Patch('variants/:mediaId')
  @UseInterceptors(FileInterceptor('file', { storage: MediaController.storage }))
  async updateVariantMedia(
    @Param('mediaId') mediaId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('Fichier requis');

    return this.mediaService.updateVariantMedia(
      Number(mediaId),
      req.user.vendorId,
      `/uploads/${file.filename}`,
      this.getMediaType(file),
      file.size,
    );
  }

  @UseGuards(JwtAuthGuard, VendorApprovedGuard)
  @Delete('variants/:mediaId')
  deleteVariantMedia(@Param('mediaId') id: string, @Req() req: any) {
    return this.mediaService.deleteVariantMedia(
      Number(id),
      req.user.vendorId,
    );
  }

  @Get('variants/:variantId')
  findByVariant(@Param('variantId') id: string) {
    return this.mediaService.findByVariant(Number(id));
  }
}