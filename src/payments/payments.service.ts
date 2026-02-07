import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitPaymentDto } from './dto/init-payment.dto';
import { PaymentStatus, OrderStatus, PaymentType, LoyaltySource } from '@prisma/client';
import { LoyaltyService } from '../loyalty/loyalty.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  /**
   * INIT PAYMENT (FULL ou DEPOSIT, user ou guest)
   */
  async initPayment(userId: number | null, dto: InitPaymentDto) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: dto.orderId,
        userId: userId ?? undefined, // support guest (null)
        status: OrderStatus.PENDING,
      },
    });

    if (!order) throw new NotFoundException('Commande introuvable ou déjà payée');

    const existingPayment = await this.prisma.payment.findUnique({ where: { orderId: order.id } });
    if (existingPayment) throw new BadRequestException('Paiement déjà initié');

    const amount = dto.type === PaymentType.DEPOSIT ? order.totalAmount * 0.2 : order.totalAmount;

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        method: dto.method,
        type: dto.type,
        amount,
        status: PaymentStatus.PENDING,
        attempts: { create: { status: PaymentStatus.PENDING } },
      },
    });

    await this.prisma.transactionLog.create({
      data: {
        type: 'INIT_PAYMENT',
        payload: { paymentId: payment.id, orderId: order.id, userId, method: payment.method, type: payment.type, amount: payment.amount },
      },
    });

    return {
      message: 'Paiement initialisé',
      reference: `PAY-${payment.id}`,
      paymentId: payment.id,
      amount: payment.amount,
      type: payment.type,
      method: payment.method,
    };
  }

  /**
   * WEBHOOK (Orange / MTN)
   */
  async handleWebhook(reference: string, status: PaymentStatus) {
    if (!reference.startsWith('PAY-')) throw new BadRequestException('Référence invalide');

    const paymentId = Number(reference.replace('PAY-', ''));
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
    if (!payment) throw new NotFoundException('Paiement introuvable');

    if (payment.status === PaymentStatus.SUCCESS) {
      return { message: 'Paiement déjà confirmé', paymentStatus: payment.status, orderStatus: payment.order.status };
    }

    return this.prisma.$transaction(async tx => {
      await tx.paymentAttempt.create({ data: { paymentId: payment.id, status } });

      await tx.transactionLog.create({
        data: { type: status === PaymentStatus.SUCCESS ? 'WEBHOOK_SUCCESS' : 'WEBHOOK_FAILED', payload: { paymentId: payment.id, reference, status } },
      });

      const updatedPayment = await tx.payment.update({ where: { id: payment.id }, data: { status } });

      let updatedOrderStatus: OrderStatus | null = null;

      if (status === PaymentStatus.SUCCESS && payment.type === PaymentType.FULL) {
        const updatedOrder = await tx.order.update({ where: { id: payment.orderId }, data: { status: OrderStatus.PAID } });
        updatedOrderStatus = updatedOrder.status;

        // Création shipment si inexistant
        const existingShipment = await tx.shipment.findUnique({ where: { orderId: payment.orderId } });
        if (!existingShipment) {
          await tx.shipment.create({ data: { orderId: payment.orderId, status: 'CREATED', events: { create: { label: 'Commande préparée' } } } });
        }

        // Fidélité
        const points = Math.floor(payment.amount / 100);
        if (payment.order.userId) {
          await this.loyaltyService.addPoints(payment.order.userId, points, LoyaltySource.ORDER, `ORDER_${payment.orderId}`);

          // Parrainage
          const referral = await tx.referral.findFirst({ where: { refereeId: payment.order.userId, rewardGiven: false } });
          if (referral) {
            await this.loyaltyService.addPoints(referral.referrerId, 200, LoyaltySource.REFERRAL, `REFERRAL_${payment.order.userId}`);
            await tx.referral.update({ where: { id: referral.id }, data: { rewardGiven: true } });
          }
        }
      }

      return { message: 'Webhook traité', paymentStatus: updatedPayment.status, orderStatus: updatedOrderStatus ?? payment.order.status };
    });
  }
}
