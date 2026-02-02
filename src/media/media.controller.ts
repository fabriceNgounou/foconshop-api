// src/media/media.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role, MediaType } from '@prisma/client';
import { VendorApprovedGuard } from '../vendor/guards/vendor-approved.guard';
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /* 🔐 VENDOR – UPLOAD MEDIA (IMAGE / VIDEO) */
  @UseGuards(JwtAuthGuard, VendorApprovedGuard)
  @Post('products/:productId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) => {
          const uniqueName =
            Date.now() + '-' + Math.round(Math.random() * 1e9) + extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB
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
    }),
  )
  async uploadProductMedia(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Fichier requis');
    }

    let mediaType: MediaType;

    if (file.mimetype.startsWith('image/')) {
      mediaType = MediaType.IMAGE;
    } else if (file.mimetype.startsWith('video/')) {
      mediaType = MediaType.VIDEO;
    } else {
      throw new BadRequestException('Type de média invalide');
    }

    return this.mediaService.addProductMedia(
      Number(productId),
      req.user.vendorId,
      `/uploads/${file.filename}`,
      mediaType,
    );
  }

  /* 🔓 PUBLIC – LIST PRODUCT MEDIA */
  @Get('products/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.mediaService.findByProduct(Number(productId));
  }
}
