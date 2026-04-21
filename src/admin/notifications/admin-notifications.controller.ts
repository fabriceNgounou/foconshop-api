// src/admin/notifications/admin-notifications.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminNotificationsService } from './admin-notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { SendGroupNotificationDto } from './dto/send-group-notification.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminNotificationsController {
  constructor(
    private readonly adminNotificationsService: AdminNotificationsService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                          ENVOI INDIVIDUEL                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * POST /admin/notifications/send/:userId
   * Envoyer une notification à un utilisateur spécifique
   */
  @Post('send/:userId')
  @HttpCode(HttpStatus.CREATED)
  sendToUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: SendNotificationDto,
  ) {
    return this.adminNotificationsService.sendToUser(userId, dto);
  }

  /* -------------------------------------------------------------------------- */
  /*                          ENVOI PAR GROUPE                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * POST /admin/notifications/send-group
   * Envoyer une notification à un groupe d'utilisateurs
   */
  @Post('send-group')
  @HttpCode(HttpStatus.CREATED)
  sendToGroup(@Body() dto: SendGroupNotificationDto) {
    return this.adminNotificationsService.sendToGroup(dto);
  }

  /* -------------------------------------------------------------------------- */
  /*                          ENVOI BROADCAST                                   */
  /* -------------------------------------------------------------------------- */

  /**
   * POST /admin/notifications/broadcast
   * Envoyer une notification à TOUS les utilisateurs
   */
  @Post('broadcast')
  @HttpCode(HttpStatus.CREATED)
  sendBroadcast(@Body() dto: SendNotificationDto) {
    return this.adminNotificationsService.sendBroadcast(dto);
  }

  /* -------------------------------------------------------------------------- */
  /*                          HISTORIQUE & STATS                                */
  /* -------------------------------------------------------------------------- */

  /**
   * GET /admin/notifications/history?limit=50
   * Historique des notifications envoyées
   */
  @Get('history')
  getNotificationHistory(@Query('limit', ParseIntPipe) limit: number = 50) {
    return this.adminNotificationsService.getNotificationHistory(limit);
  }

  /**
   * GET /admin/notifications/stats
   * Statistiques globales des notifications
   */
  @Get('stats')
  getGlobalStats() {
    return this.adminNotificationsService.getGlobalStats();
  }
}