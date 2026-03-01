import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CouponType } from '@prisma/client';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Injectable()
export class PromotionService {
  constructor(private prisma: PrismaService) {}

  // Récupère la promotion active pour un produit
  async getActivePromotion(productId: number) {
    const now = new Date();

    return this.prisma.promotion.findFirst({
      where: {
        productId,
        startAt: { lte: now },
        endAt: { gte: now },
      },
    });
  }

  // Applique la promotion sur un prix
  applyPromotion(price: number, promo: any): number {
    if (!promo) return price;

    if (promo.type === CouponType.FIXED) {
      return Math.max(price - promo.value, 0);
    }

    if (promo.type === CouponType.PERCENTAGE) {
      return Math.max(price - price * (promo.value / 100), 0);
    }

    return price;
  }

  // ---- CRUD ----

  async findAll() {
    return this.prisma.promotion.findMany({
      orderBy: { startAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException(`Promotion ${id} introuvable`);
    return promo;
  }

  async create(dto: CreatePromotionDto) {
    return this.prisma.promotion.create({
      data: {
        productId: dto.productId,
        type: dto.type,
        value: dto.value,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
      },
    });
  }

  async update(id: number, dto: UpdatePromotionDto) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Promotion ${id} introuvable`);

    return this.prisma.promotion.update({
      where: { id },
      data: {
        productId: dto.productId,
        type: dto.type,
        value: dto.value,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Promotion ${id} introuvable`);

    return this.prisma.promotion.delete({ where: { id } });
  }
}