
// src/notifications/notification.controller.ts
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                           GET MY NOTIFICATIONS                             */
  /* -------------------------------------------------------------------------- */

  @Get()
  async getMyNotifications(@Req() req: any) {
    return this.notificationService.findMyNotifications(req.user.id);
  }

  /* -------------------------------------------------------------------------- */
  /*                           UNREAD COUNT                                     */
  /* -------------------------------------------------------------------------- */

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  /* -------------------------------------------------------------------------- */
  /*                           MARK AS READ                                     */
  /* -------------------------------------------------------------------------- */

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.notificationService.markAsRead(
      Number(id),
      req.user.id,
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                        MARK ALL AS READ                                    */
  /* -------------------------------------------------------------------------- */

  @Patch('read-all')
  async markAllAsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  /* -------------------------------------------------------------------------- */
  /*                           DELETE                                           */
  /* -------------------------------------------------------------------------- */

  @Delete(':id')
  async deleteNotification(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.notificationService.deleteNotification(
      Number(id),
      req.user.id,
    );
  }
}