import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 📈 Chiffre d'affaires global
   * + nombre de commandes
   * + évolution mensuelle
   */
  async getSalesMetrics(from?: string, to?: string) {
    const dateFilter: any = {};

    if (from) {
      dateFilter.gte = new Date(from);
    }
    if (to) {
      dateFilter.lte = new Date(to);
    }

    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PAID,
        ...(from || to ? { createdAt: dateFilter } : {}),
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    });

    const totalSales = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    const salesByMonth: Record<string, number> = {};

    for (const order of orders) {
      const key = `${order.createdAt.getFullYear()}-${String(
        order.createdAt.getMonth() + 1,
      ).padStart(2, '0')}`;

      salesByMonth[key] =
        (salesByMonth[key] || 0) + order.totalAmount;
    }

    return {
      totalSales,
      totalOrders: orders.length,
      byMonth: Object.entries(salesByMonth).map(
        ([month, amount]) => ({
          month,
          amount,
        }),
      ),
    };
  }

  /**
   * 🛍️ Top catégories (ventes + revenus)
   */
  async getTopCategories() {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: {
          status: OrderStatus.PAID,
        },
      },
      select: {
        quantity: true,
        unitPrice: true,
        variant: {
          select: {
            product: {
              select: {
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const stats: Record<
      string,
      { itemsSold: number; revenue: number }
    > = {};

    for (const item of items) {
      const category =
        item.variant.product.category?.name ??
        'Sans catégorie';

      if (!stats[category]) {
        stats[category] = {
          itemsSold: 0,
          revenue: 0,
        };
      }

      stats[category].itemsSold += item.quantity;
      stats[category].revenue +=
        item.quantity * item.unitPrice;
    }

    return Object.entries(stats)
      .map(([category, data]) => ({
        category,
        ...data,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * 🏙️ Répartition des ventes par ville
   */
  async getSalesByCity() {
    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PAID,
      },
      select: {
        totalAmount: true,
        address: {
          select: {
            city: true,
          },
        },
      },
    });

    const stats: Record<
      string,
      { orders: number; revenue: number }
    > = {};

    for (const order of orders) {
      const city = order.address.city;

      if (!stats[city]) {
        stats[city] = {
          orders: 0,
          revenue: 0,
        };
      }

      stats[city].orders += 1;
      stats[city].revenue += order.totalAmount;
    }

    return Object.entries(stats)
      .map(([city, data]) => ({
        city,
        ...data,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }
}
