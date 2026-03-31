// src/cart/cart.scheduler.ts

import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CartReminderService } from './cart-reminder.service';

@Injectable()
export class CartScheduler {
  constructor(
    private readonly cartReminderService: CartReminderService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                ⏰ CRON JOB (CHAQUE HEURE)                                  */
  /* -------------------------------------------------------------------------- */

  @Cron('0 * * * *') // toutes les heures
  async handleCartReminders() {
    console.log('⏰ CRON: Vérification des paniers abandonnés...');

    await this.cartReminderService.handleAbandonedCarts();
  }

  /* -------------------------------------------------------------------------- */
  /*                🧪 MODE TEST (CHAQUE MINUTE)                                */
  /* -------------------------------------------------------------------------- */

  // 👉 Active temporairement pour tester
  // @Cron('*/1 * * * *')
  // async testCron() {
  //   console.log('🧪 TEST CRON');
  //   await this.cartReminderService.handleAbandonedCarts();
  // }
}