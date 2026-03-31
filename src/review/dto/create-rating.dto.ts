import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  value: number;

  @IsOptional()
  @IsInt()
  productId?: number;

  @IsOptional()
  @IsInt()
  vendorId?: number;

  @IsOptional()
  @IsInt()
  orderId?: number;
}
