// src/admin/coupons/dto/update-coupon.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCouponDto } from './create-coupon.dto';

/**
 * DTO pour la mise à jour partielle d'un coupon.
 * Tous les champs sont optionnels (hérité de CreateCouponDto).
 */
export class UpdateCouponDto extends PartialType(CreateCouponDto) {}