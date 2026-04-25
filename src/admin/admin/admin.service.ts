import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /* ===========================
     PROMOTE USER TO ADMIN
     =========================== */
  async makeAdmin(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.ADMIN) {
      throw new BadRequestException('User is already admin');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role: Role.ADMIN,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  /* ===========================
     LIST ALL ADMINS
     =========================== */
  async listAdmins() {
    return this.prisma.user.findMany({
      where: {
        role: Role.ADMIN,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  /* ===========================
     REMOVE ADMIN ROLE
     =========================== */
  async removeAdmin(userId: number, currentAdminId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== Role.ADMIN) {
      throw new BadRequestException('User is not admin');
    }

    // 🔒 empêcher un admin de retirer son propre rôle
    if (currentAdminId === userId) {
      throw new BadRequestException(
        'You cannot remove your own admin role',
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role: Role.CLIENT,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
  }
}