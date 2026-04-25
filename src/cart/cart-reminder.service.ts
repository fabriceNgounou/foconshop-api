// src/cart/cart-reminder.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class CartReminderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                🔍 TROUVER LES PANIERS ABANDONNÉS                           */
  /* -------------------------------------------------------------------------- */
  async findAbandonedCarts() {
    const ONE_HOUR = 60 * 60 * 1000;
    const threshold = new Date(Date.now() - ONE_HOUR);

    return this.prisma.cart.findMany({
      where: {
        updatedAt: { lt: threshold },
        items: { some: {} }, // panier non vide
      },
      include: {
        user: true,
        items: true,
      },
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                🚀 TRAITER UN PANIER (ENVOI RAPPEL)                         */
  /* -------------------------------------------------------------------------- */
  async processCartReminder(cart: any) {
    try {
      // 1️⃣ Vérifier utilisateur
      if (!cart.user || !cart.user.email) {
        console.log(`❌ Pas d'email pour le panier ${cart.id}`);
        return;
      }

      // 2️⃣ Vérifier si déjà envoyé
      const existing = await this.prisma.cartReminder.findFirst({
        where: { cartId: cart.id },
      });

      if (existing) {
        console.log(`⏩ Rappel déjà envoyé pour cart ${cart.id}`);
        return;
      }

      // 3️⃣ Formatter les items
      const formattedItems = cart.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));

      // 4️⃣ Envoyer email
      await this.emailService.sendCartReminderEmail(
        cart.user.email,
        formattedItems,
      );

      // 5️⃣ Notification interne
      try {
        await this.notificationService.notifyCartReminder(cart);
      } catch (err) {
        console.error('Notification error:', err);
      }

      // 6️⃣ Sauvegarder trace (anti-spam)
      await this.prisma.cartReminder.create({
        data: {
          cartId: cart.id,
          type: 'FIRST',
        },
      });

      console.log(`✅ Rappel envoyé pour cart ${cart.id}`);
    } catch (error) {
      console.error('❌ Erreur processCartReminder:', error);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                🔄 TRAITER TOUS LES PANIERS                                 */
  /* -------------------------------------------------------------------------- */
  async handleAbandonedCarts() {
    const carts = await this.findAbandonedCarts();

    console.log(`🛒 ${carts.length} panier(s) abandonné(s) trouvé(s)`);

    for (const cart of carts) {
      await this.processCartReminder(cart);
    }
  }
}