// src/vendor/vendor.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { VendorService } from './vendor.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateVendorStatusDto } from './dto/update-vendor-status.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';

@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  /**
   * CLIENT → demander à devenir vendeur
   */
  @Post()
  @Roles(Role.CLIENT, Role.VENDOR)
  becomeVendor(@Req() req: any, @Body() dto: CreateVendorDto) {
    return this.vendorService.createVendor(req.user.sub, dto);
  }

  /**
   * VENDOR → ajouter KYC (route sécurisée - ANCIENNE MÉTHODE avec URL)
   */
  @Post('me/kyc')
  @Roles(Role.VENDOR)
  uploadMyKyc(@Req() req: any, @Body() dto: CreateKycDto) {
    return this.vendorService.addKycDocument(req.user.vendorId, dto);
  }

  // =========================
  //  Upload avec fichiers physiques
  // =========================

  /**
   * VENDOR → Upload document KYC avec fichier
   */
  @Post('me/kyc/upload')
  @Roles(Role.VENDOR)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = process.env.KYC_UPLOAD_DIR || join(process.cwd(), 'uploads', 'kyc');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (_, file, cb) => {
          const uniqueName =
            'kyc-' +
            Date.now() +
            '-' +
            Math.round(Math.random() * 1e9) +
            extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // Max 5 Mo
      },
      fileFilter: (_, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/pdf',
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Type de fichier non supporté. Formats acceptés: JPEG, PNG, PDF'
            ),
            false
          );
        }
      },
    })
  )
  async uploadKycDocumentWithFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Fichier requis');
    }

    if (!type) {
      throw new BadRequestException('Type de document requis');
    }

    const validTypes = [
      'ID_CARD',
      'CNI',
      'PASSPORT',
      'BUSINESS_LICENSE',
      'TAX_CERTIFICATE',
      'PROOF_OF_ADDRESS',
    ];

    if (!validTypes.includes(type)) {
      throw new BadRequestException(
        `Type invalide. Types acceptés: ${validTypes.join(', ')}`
      );
    }

    return this.vendorService.addKycDocumentWithFile(
      req.user.vendorId,
      `/uploads/kyc/${file.filename}`,
      type,
      file.size
    );
  }

  /**
   * VENDOR → Mettre à jour un document KYC
   */
  @Patch('me/kyc/:kycDocId')
  @Roles(Role.VENDOR)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = process.env.KYC_UPLOAD_DIR || join(process.cwd(), 'uploads', 'kyc');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (_, file, cb) => {
          const uniqueName =
            'kyc-' +
            Date.now() +
            '-' +
            Math.round(Math.random() * 1e9) +
            extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/pdf',
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Type de fichier non supporté. Formats acceptés: JPEG, PNG, PDF'
            ),
            false
          );
        }
      },
    })
  )
  async updateKycDocument(
    @Param('kycDocId') kycDocId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Fichier requis');
    }

    return this.vendorService.updateKycDocument(
      Number(kycDocId),
      req.user.vendorId,
      `/uploads/kyc/${file.filename}`,
      file.size
    );
  }

  /**
   * VENDOR → Supprimer un document KYC
   */
  @Delete('me/kyc/:kycDocId')
  @Roles(Role.VENDOR)
  async deleteKycDocument(
    @Param('kycDocId') kycDocId: string,
    @Req() req: any,
  ) {
    return this.vendorService.deleteKycDocument(
      Number(kycDocId),
      req.user.vendorId
    );
  }


  /**
   * ADMIN → valider / rejeter vendeur
   */
  @Patch(':id/status')
  @Roles(Role.ADMIN)
  updateVendorStatus(
    @Param('id') id: string,
    @Body() dto: UpdateVendorStatusDto,
  ) {
    return this.vendorService.updateStatus(Number(id), dto.status);
  }

  /**
   * ADMIN → vendeurs en attente
   */
  @Get('pending')
  @Roles(Role.ADMIN)
  getPendingVendors() {
    return this.vendorService.getPendingVendors();
  }

  /**
   * VENDOR → Récupérer les commandes d'un vendeur
   */
  @Get('orders')
  getMyOrders(@Req() req: any) {
    return this.vendorService.findOrdersForVendor(req.user.sub);
  }

  /**
   * VENDOR → voir son profil
   */
  @Get('me')
  getMyVendorProfile(@Req() req: any) {
    return this.vendorService.getMyVendorProfile(req.user.sub);
  }

  /**
   * VENDOR → Liste mes documents KYC
   */
  @Get('my-kyc-documents')
  getMyKycDocuments(@Req() req: any) {
    return this.vendorService.getMyKycDocuments(req.user.sub);
  }
}