import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsInt()
  productId?: number;

  @IsOptional()
  @IsInt()
  vendorId?: number;
}