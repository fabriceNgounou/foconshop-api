// src/admin/vendors/admin-vendors.service.ts
import { Injectable } from '@nestjs/common';
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
}
