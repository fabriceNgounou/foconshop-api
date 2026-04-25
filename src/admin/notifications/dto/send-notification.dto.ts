// src/admin/notifications/dto/send-notification.dto.ts
import { IsString, IsNotEmpty, IsEnum, IsOptional, MinLength } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Le titre doit contenir au moins 3 caractères' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Le message doit contenir au moins 10 caractères' })
  message: string;

  @IsOptional()
  @IsEnum(NotificationType, { message: 'Type de notification invalide' })
  type?: NotificationType;
}