// src/vendor/vendor.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import { VendorStatus, Role } from '@prisma/client';
import { CreateVendorDto } from './dto/create-vendor.dto';
import slugify from 'slugify';

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
      slug,

      phone: firstShop ? firstShop.phone : dto.phone,
      address: firstShop ? firstShop.address : dto.address,
      city: firstShop ? firstShop.city : dto.city,
      region: firstShop ? firstShop.region : dto.region,

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

  return vendors; // Retourne un tableau de boutiques
}

  async getById(id: number) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id },
      include: { kycDocs: true, products: true, user: { select: { email: true, phone: true } } },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async addKycDocument(vendorId: number, dto: CreateKycDto) {
  // Vérifier que le profil vendeur existe
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


  private generateCodeUnique(vendorId: number) {
    // Ex: VEND-2025-000123
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

    /**
     * 🔒 Transaction atomique :
     * - validation vendeur
     * - changement de rôle utilisateur
     */
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
  // Remplacer findUnique par findFirst pour supporter plusieurs boutiques
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
