// src/notifications/notification.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  /* -------------------------------------------------------------------------- */
  /*                             CREATE GENERIC                                 */
  /* -------------------------------------------------------------------------- */

  async createNotification(data: {
    userId?: number;
    title: string;
    message: string;
    type: NotificationType;
  }) {
    return this.prisma.notification.create({
      data,
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                           BUSINESS LOGIC                                   */
  /* -------------------------------------------------------------------------- */

  async notifyNewOrder(order: any) {
    // 👤 CLIENT
    if (order.userId) {
      await this.createNotification({
        userId: order.userId,
        title: 'Commande créée',
        message: `Votre commande #${order.id} a été créée`,
        type: NotificationType.ORDER_CREATED,
      });
    }

    // 🏪 VENDEURS (on récupère tous les vendors concernés)
    const vendorIds = new Set<number>();

    order.items.forEach((item: any) => {
      if (item.variant?.product?.vendorId) {
        vendorIds.add(item.variant.product.vendorId);
      }
    });

    for (const vendorId of vendorIds) {
      await this.createNotification({
        userId: vendorId,
        title: 'Nouvelle commande',
        message: `Une commande contient vos produits`,
        type: NotificationType.NEW_ORDER_VENDOR,
      });
    }

    // 🛡️ ADMINS
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
    });

    for (const admin of admins) {
      await this.createNotification({
        userId: admin.id,
        title: 'Nouvelle commande',
        message: `Commande #${order.id} créée`,
        type: NotificationType.NEW_ORDER_ADMIN,
      });
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                           USER NOTIFICATIONS                               */
  /* -------------------------------------------------------------------------- */

  async findMyNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(notificationId: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async deleteNotification(notificationId: number, userId: number) {
    return this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }
}
