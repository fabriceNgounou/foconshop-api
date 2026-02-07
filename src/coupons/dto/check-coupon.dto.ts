import { IsString } from 'class-validator';

export class CheckCouponDto {
  @IsString()
  code: string;
}
