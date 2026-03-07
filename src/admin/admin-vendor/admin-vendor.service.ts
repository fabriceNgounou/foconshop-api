// src/admin/vendors/admin-vendors.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminVendorsService {
  constructor(private readonly prisma: PrismaService) {}

  // 6️⃣ Lister tous les vendeurs
  async findAllVendors() {
    return this.prisma.vendorProfile.findMany({
      include: { user: true, products: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVendorKycDocuments(vendorId: number) {
  const vendor = await this.prisma.vendorProfile.findUnique({
    where: { id: vendorId },
    include: {
      kycDocs: true,
      user: {
        select: {
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!vendor) {
    throw new NotFoundException('Vendor not found');
  }

  return {
    vendorId: vendor.id,
    businessName: vendor.businessName,
    kycDocuments: vendor.kycDocs,
  };
}
}
