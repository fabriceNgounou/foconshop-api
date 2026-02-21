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
import { MediaType } from '@prisma/client';
import { VendorApprovedGuard } from '../vendor/guards/vendor-approved.guard';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // =========================
  // UPLOAD MEDIA
  // =========================
  @UseGuards(JwtAuthGuard, VendorApprovedGuard)
  @Post('products/:productId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
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
      }),
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
      fileFilter: (_, file, cb) => {
        if (
          file.mimetype.startsWith('image/') ||
          file.mimetype.startsWith('video/')
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Type de fichier non supporté'), false);
        }
      },
    })
  )
  async uploadProductMedia(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Fichier requis');
    }

    const mediaType = file.mimetype.startsWith('image/')
      ? MediaType.IMAGE
      : MediaType.VIDEO;

    return this.mediaService.addProductMedia(
      Number(productId),
      req.user.vendorId,
      `/uploads/${file.filename}`,
      mediaType,
    );
  }

  // =========================
  // UPDATE MEDIA
  // =========================
  @UseGuards(JwtAuthGuard, VendorApprovedGuard)
  @Patch(':mediaId')
  @UseInterceptors(FileInterceptor('file'))
  async updateProductMedia(
    @Param('mediaId') mediaId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Fichier requis');
    }

    const mediaType = file.mimetype.startsWith('image/')
      ? MediaType.IMAGE
      : MediaType.VIDEO;

    return this.mediaService.updateProductMedia(
      Number(mediaId),
      req.user.vendorId,
      `/uploads/${file.filename}`,
      mediaType,
    );
  }

  // =========================
  // DELETE MEDIA
  // =========================
  @UseGuards(JwtAuthGuard, VendorApprovedGuard)
  @Delete(':mediaId')
  async deleteProductMedia(
    @Param('mediaId') mediaId: string,
    @Req() req: any,
  ) {
    return this.mediaService.deleteProductMedia(
      Number(mediaId),
      req.user.vendorId,
    );
  }

  // =========================
  // PUBLIC – LIST MEDIA
  // =========================
  @Get('products/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.mediaService.findByProduct(Number(productId));
  }
}