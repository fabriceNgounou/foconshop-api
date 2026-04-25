// src/admin/notifications/dto/send-group-notification.dto.ts
import { IsString, IsNotEmpty, IsEnum, IsOptional, MinLength } from 'class-validator';
import { NotificationType, Role } from '@prisma/client';

export enum TargetGroup {
  ALL = 'ALL',                    // Tous les utilisateurs
  CLIENTS = 'CLIENTS',            // Tous les clients
  VENDORS = 'VENDORS',            // Tous les vendeurs
  ACTIVE_CLIENTS = 'ACTIVE_CLIENTS', // Clients avec commandes récentes
  INACTIVE_CLIENTS = 'INACTIVE_CLIENTS', // Clients sans commandes depuis 30j
  TOP_CLIENTS = 'TOP_CLIENTS',    // Top 10% clients par CA
  BY_CITY = 'BY_CITY',            // Par ville spécifique
}

export class SendGroupNotificationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Le titre doit contenir au moins 3 caractères' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Le message doit contenir au moins 10 caractères' })
  message: string;

  @IsEnum(TargetGroup, { message: 'Groupe cible invalide' })
  targetGroup: TargetGroup;

  @IsOptional()
  @IsString()
  city?: string; // Requis si targetGroup = BY_CITY

  @IsOptional()
  @IsEnum(NotificationType, { message: 'Type de notification invalide' })
  type?: NotificationType;
}