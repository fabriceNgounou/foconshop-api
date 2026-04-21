// src/admin/notifications/admin-notifications.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType, Role } from '@prisma/client';
import { SendNotificationDto } from './dto/send-notification.dto';
import { SendGroupNotificationDto, TargetGroup } from './dto/send-group-notification.dto';

@Injectable()
export class AdminNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /* -------------------------------------------------------------------------- */
  /*                          ENVOI INDIVIDUEL                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * Envoyer une notification à un utilisateur spécifique
   */
  async sendToUser(userId: number, dto: SendNotificationDto) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur #${userId} introuvable`);
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title: dto.title,
        message: dto.message,
        type: dto.type || NotificationType.NEW_ORDER_ADMIN, // Type par défaut
      },
    });

    return {
      message: `Notification envoyée à ${user.username}`,
      notification,
      recipient: user,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                          ENVOI PAR GROUPE                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * Envoyer une notification à un groupe d'utilisateurs
   */
  async sendToGroup(dto: SendGroupNotificationDto) {
    // Déterminer les utilisateurs cibles selon le groupe
    let targetUsers: number[] = [];

    switch (dto.targetGroup) {
      case TargetGroup.ALL:
        targetUsers = await this.getAllUsers();
        break;

      case TargetGroup.CLIENTS:
        targetUsers = await this.getClientUsers();
        break;

      case TargetGroup.VENDORS:
        targetUsers = await this.getVendorUsers();
        break;

      case TargetGroup.ACTIVE_CLIENTS:
        targetUsers = await this.getActiveClients();
        break;

      case TargetGroup.INACTIVE_CLIENTS:
        targetUsers = await this.getInactiveClients();
        break;

      case TargetGroup.TOP_CLIENTS:
        targetUsers = await this.getTopClients();
        break;

      case TargetGroup.BY_CITY:
        if (!dto.city) {
          throw new BadRequestException(
            'Le paramètre "city" est requis pour le groupe BY_CITY'
          );
        }
        targetUsers = await this.getUsersByCity(dto.city);
        break;

      default:
        throw new BadRequestException('Groupe cible invalide');
    }

    if (targetUsers.length === 0) {
      return {
        message: 'Aucun utilisateur trouvé pour ce groupe',
        recipientCount: 0,
      };
    }

    // Créer les notifications en batch
    const notifications = await this.prisma.notification.createMany({
      data: targetUsers.map((userId) => ({
        userId,
        title: dto.title,
        message: dto.message,
        type: dto.type || NotificationType.NEW_ORDER_ADMIN,
      })),
    });

    return {
      message: `Notification envoyée à ${targetUsers.length} utilisateur(s)`,
      recipientCount: targetUsers.length,
      targetGroup: dto.targetGroup,
      ...(dto.city && { city: dto.city }),
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                          ENVOI BROADCAST                                   */
  /* -------------------------------------------------------------------------- */

  /**
   * Envoyer une notification à TOUS les utilisateurs
   */
  async sendBroadcast(dto: SendNotificationDto) {
    const allUsers = await this.getAllUsers();

    if (allUsers.length === 0) {
      return {
        message: 'Aucun utilisateur dans la base de données',
        recipientCount: 0,
      };
    }

    await this.prisma.notification.createMany({
      data: allUsers.map((userId) => ({
        userId,
        title: dto.title,
        message: dto.message,
        type: dto.type || NotificationType.NEW_ORDER_ADMIN,
      })),
    });

    return {
      message: `Notification broadcast envoyée à ${allUsers.length} utilisateur(s)`,
      recipientCount: allUsers.length,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                          HISTORIQUE & STATS                                */
  /* -------------------------------------------------------------------------- */

  /**
   * Historique de toutes les notifications envoyées par l'admin
   */
  async getNotificationHistory(limit: number = 50) {
    return this.prisma.notification.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Statistiques globales des notifications
   */
  async getGlobalStats() {
    const totalNotifications = await this.prisma.notification.count();

    const totalRead = await this.prisma.notification.count({
      where: { isRead: true },
    });

    const totalUnread = await this.prisma.notification.count({
      where: { isRead: false },
    });

    const readRate = totalNotifications > 0
      ? ((totalRead / totalNotifications) * 100).toFixed(2)
      : '0.00';

    // Notifications par type
    const notificationsByType = await this.prisma.notification.groupBy({
      by: ['type'],
      _count: {
        type: true,
      },
      orderBy: {
        _count: {
          type: 'desc',
        },
      },
    });

    // Notifications récentes (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentNotifications = await this.prisma.notification.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    return {
      totalNotifications,
      totalRead,
      totalUnread,
      readRate: `${readRate}%`,
      notificationsByType,
      recentNotificationsLast7Days: recentNotifications,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                      MÉTHODES PRIVÉES DE SEGMENTATION                      */
  /* -------------------------------------------------------------------------- */

  /**
   * Tous les utilisateurs
   */
  private async getAllUsers(): Promise<number[]> {
    const users = await this.prisma.user.findMany({
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  /**
   * Utilisateurs avec rôle CLIENT
   */
  private async getClientUsers(): Promise<number[]> {
    const users = await this.prisma.user.findMany({
      where: { role: Role.CLIENT },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  /**
   * Utilisateurs avec rôle VENDOR
   */
  private async getVendorUsers(): Promise<number[]> {
    const users = await this.prisma.user.findMany({
      where: { role: Role.VENDOR },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  /**
   * Clients actifs (ayant passé une commande dans les 30 derniers jours)
   */
  private async getActiveClients(): Promise<number[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeOrders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
        userId: {
          not: null,
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    return activeOrders
      .map((o) => o.userId)
      .filter((id): id is number => id !== null);
  }

  /**
   * Clients inactifs (aucune commande depuis 30 jours)
   */
  private async getInactiveClients(): Promise<number[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Tous les clients
    const allClients = await this.prisma.user.findMany({
      where: { role: Role.CLIENT },
      select: { id: true },
    });

    // Clients actifs
    const activeClientIds = await this.getActiveClients();

    // Différence = clients inactifs
    return allClients
      .map((u) => u.id)
      .filter((id) => !activeClientIds.includes(id));
  }

  /**
   * Top clients (10% des clients par nombre de commandes)
   */
  private async getTopClients(): Promise<number[]> {
    const clientOrders = await this.prisma.order.groupBy({
      by: ['userId'],
      where: {
        userId: {
          not: null,
        },
      },
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
    });

    // Top 10%
    const topCount = Math.ceil(clientOrders.length * 0.1);
    return clientOrders
      .slice(0, topCount)
      .map((o) => o.userId)
      .filter((id): id is number => id !== null);
  }

  /**
   * Utilisateurs par ville (basé sur leurs adresses)
   */
  private async getUsersByCity(city: string): Promise<number[]> {
    const addresses = await this.prisma.address.findMany({
      where: {
        city: {
          equals: city,
          mode: 'insensitive',
        },
        userId: {
          not: null,
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    return addresses
      .map((a) => a.userId)
      .filter((id): id is number => id !== null);
  }
}