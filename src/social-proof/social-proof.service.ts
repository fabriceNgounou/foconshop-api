import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SocialProofService {
  constructor(private prisma: PrismaService) {}

  async getRecent() {
    const since = new Date(Date.now() - 30 * 60 * 1000); // 30 min

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: since },
      },
      include: {
        address: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => ({
      product: order.items[0]?.variant.product.title,
      city: order.address.city,
      minutesAgo: Math.floor(
        (Date.now() - order.createdAt.getTime()) / 60000,
      ),
    }));
  }
}