// src/vendor/vendor.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import { VendorStatus, Role } from '@prisma/client';
import { CreateVendorDto } from './dto/create-vendor.dto';
import slugify from 'slugify';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService) {}

  async createVendor(userId: number, dto: CreateVendorDto) {
    // 1️⃣ vérifier le nombre de boutiques
    const shopCount = await this.prisma.vendorProfile.count({
      where: { userId }
    });

    if (shopCount >= 5) {
      throw new BadRequestException('Maximum 5 shops allowed');
    }

    // 2️⃣ récupérer une boutique existante
    const firstShop = await this.prisma.vendorProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    // 3️⃣ générer slug
    const baseSlug = slugify(dto.businessName, {
      lower: true,
      strict: true
    });

    const slug = `${baseSlug}-${Date.now()}`;

    // 4️⃣ création boutique
    return this.prisma.vendorProfile.create({
      data: {
        businessName: dto.businessName,
        description: dto.description,
        categoryId: dto.categoryId,
        phone:dto.phone,
        address: dto.address,
        city: dto.city,
        region: dto.region,
        slug,
        userId
      }
    });
  }

  async getByUserId(userId: number) {
    const vendors = await this.prisma.vendorProfile.findMany({
      where: { userId },
      include: { 
        kycDocs: true, 
        products: true, 
        user: { select: { email: true, phone: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });

    return vendors;
  }

  async getById(id: number) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id },
      include: { kycDocs: true, products: true, user: { select: { email: true, phone: true } } },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  // ✅ MÉTHODE EXISTANTE (garde compatibilité avec l'ancien système)
  async addKycDocument(vendorId: number, dto: CreateKycDto) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return this.prisma.kycDocument.create({
      data: {
        vendorProfileId: vendorId,
        type: dto.type,
        url: dto.url,
        status: 'PENDING',
      },
    });
  }

  // Upload de document KYC avec fichier physique
  async addKycDocumentWithFile(
    vendorId: number, 
    url: string, 
    type: string, 
    fileSize: number
  ) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    // ✅ Vérifier le nombre de documents existants pour ce type
    const docCount = await this.prisma.kycDocument.count({
      where: { 
        vendorProfileId: vendorId,
        type,
      },
    });

    if (docCount >= 1) {
      throw new BadRequestException(
        `Un document de type ${type} existe déjà. Veuillez le supprimer avant d'en ajouter un nouveau.`
      );
    }

    // ✅ Vérifier la taille du fichier (max 5 Mo)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException('Le document ne peut pas dépasser 5 Mo');
    }

    return this.prisma.kycDocument.create({
      data: {
        vendorProfileId: vendorId,
        type,
        url,
        status: 'PENDING',
      },
    });
  }

  // Mettre à jour un document KYC
  async updateKycDocument(
    kycDocId: number,
    vendorId: number,
    newUrl: string,
    fileSize: number
  ) {
    const kycDoc = await this.prisma.kycDocument.findUnique({
      where: { id: kycDocId },
    });

    if (!kycDoc) {
      throw new NotFoundException('Document KYC introuvable');
    }

    if (kycDoc.vendorProfileId !== vendorId) {
      throw new ForbiddenException('Accès refusé à ce document');
    }

    // ✅ Vérifier la taille du fichier
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException('Le document ne peut pas dépasser 5 Mo');
    }

    // ✅ Supprimer l'ancien fichier
    const oldPath = join(process.cwd(), kycDoc.url);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }

    return this.prisma.kycDocument.update({
      where: { id: kycDocId },
      data: {
        url: newUrl,
        status: 'PENDING',
      },
    });
  }

  //  Supprimer un document KYC
  async deleteKycDocument(kycDocId: number, vendorId: number) {
    const kycDoc = await this.prisma.kycDocument.findUnique({
      where: { id: kycDocId },
    });

    if (!kycDoc) {
      throw new NotFoundException('Document KYC introuvable');
    }

    if (kycDoc.vendorProfileId !== vendorId) {
      throw new ForbiddenException('Accès refusé à ce document');
    }

    // ✅ Supprimer le fichier physique
    const filePath = join(process.cwd(), kycDoc.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.prisma.kycDocument.delete({
      where: { id: kycDocId },
    });

    return { message: 'Document KYC supprimé avec succès' };
  }

  private generateCodeUnique(vendorId: number) {
    const year = new Date().getFullYear();
    const padded = String(vendorId).padStart(6, '0');
    return `VEND-${year}-${padded}`;
  }

  async updateStatus(vendorId: number, status: VendorStatus) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: { user: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.status === VendorStatus.APPROVED) {
      throw new BadRequestException('Vendor already approved');
    }

    if (status !== VendorStatus.APPROVED && status !== VendorStatus.REJECTED) {
      throw new BadRequestException('Invalid vendor status');
    }

    const codeUnique =
      status === VendorStatus.APPROVED
        ? this.generateCodeUnique(vendor.id)
        : null;

    return this.prisma.$transaction(async (tx) => {
      const updatedVendor = await tx.vendorProfile.update({
        where: { id: vendorId },
        data: {
          status,
          codeUnique,
        },
      });

      if (status === VendorStatus.APPROVED) {
        await tx.user.update({
          where: { id: vendor.userId },
          data: {
            role: Role.VENDOR,
          },
        });
      }

      return updatedVendor;
    });
  }

  async getPendingVendors() {
    return this.prisma.vendorProfile.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
        kycDocs: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOrdersForVendor(userId: number) {
    const vendor = await this.prisma.vendorProfile.findFirst({
      where: { userId },
    });
    if (!vendor) return [];

    return this.prisma.order.findMany({
      where: {
        items: {
          some: {
            variant: { product: { vendorId: vendor.id } },
          },
        },
      },
      include: {
        items: true,
        address: true,
        shipment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyVendorProfile(userId: number) {
    const vendor = await this.prisma.vendorProfile.findFirst({
      where: { userId },
      include: {
        kycDocs: true,
        products: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return vendor;
  }

  async getVendorProfile(userId: number) {
    const vendor = await this.prisma.vendorProfile.findFirst({
      where: { userId },
      include: {
        products: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return vendor;
  }

  async getMyKycDocuments(userId: number) {
    const vendor = await this.prisma.vendorProfile.findFirst({
      where: { userId },
      include: {
        kycDocs: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return vendor.kycDocs;
  }
}