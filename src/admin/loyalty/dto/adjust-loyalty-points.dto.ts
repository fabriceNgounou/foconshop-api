// src/admin/loyalty/dto/adjust-loyalty-points.dto.ts
import { IsNumber, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AdjustLoyaltyPointsDto {
  @IsInt({ message: 'userId doit être un entier' })
  @Min(1, { message: 'userId doit être positif' })
  userId: number;

  @IsNumber({}, { message: 'points doit être un nombre' })
  points: number; // Positif = crédit, Négatif = débit

  @IsOptional()
  @IsString()
  reference?: string; // Motif de l'ajustement (ex: "Geste commercial", "Correction erreur")
}