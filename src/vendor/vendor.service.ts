// src/vendor/vendor.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { VendorStatus } from '@prisma/client';

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService) {}

  async createVendorProfile(userId: number, data?: { storeName?: string }) {
    // Vérifier si existe déjà
    const existing = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (existing) return existing;

    const vendor = await this.prisma.vendorProfile.create({
      data: {
        userId,
        codeUnique: null,
        status: 'PENDING',
        createdAt: new Date(),
        // products empty by default
      },
    });
    return vendor;
  }

  async getByUserId(userId: number) {
    return this.prisma.vendorProfile.findUnique({
      where: { userId },
      include: { kycDocs: true, products: true, user: { select: { email: true, phone: true } } },
    });
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
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // 🔒 Empêcher une double validation
    if (vendor.status === 'APPROVED') {
      throw new BadRequestException(
        'Vendor is already approved',
      );
    }

    let codeUnique = vendor.codeUnique;

    if (status === 'APPROVED' && !codeUnique) {
      codeUnique = this.generateCodeUnique(vendor.id);
    }

    return this.prisma.vendorProfile.update({
      where: { id: vendorId },
      data: {
        status,
        codeUnique,
      },
    });
  }

  
}
