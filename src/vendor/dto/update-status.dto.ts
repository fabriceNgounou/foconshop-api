// src/vendor/dto/update-status.dto.ts
import { IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}
