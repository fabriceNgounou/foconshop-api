import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { OrderStatus, NotificationType } from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(userId: number, dto: CreateDisputeDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId, status: OrderStatus.PAID },
    });
    if (!order) throw new NotFoundException('Commande introuvable ou non éligible');

    const existingDispute = await this.prisma.dispute.findFirst({
      where: { orderId: order.id },
    });
    if (existingDispute)
      throw new BadRequestException('Un litige existe déjà pour cette commande');

    const dispute = await this.prisma.dispute.create({
      data: { orderId: order.id, userId, message: dto.message },
    });

    // ⚡ Notification aux admins
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        this.notificationService.createNotification({
          userId: admin.id,
          title: 'Nouveau litige',
          message: `Un litige a été ouvert pour la commande #${order.id}`,
          type: NotificationType.DISPUTE_CREATED,
        }),
      ),
    );

    return dispute;
  }

  async findMyDisputes(userId: number) {
    return this.prisma.dispute.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
