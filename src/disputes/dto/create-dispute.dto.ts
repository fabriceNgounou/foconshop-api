import { IsInt, IsString, MinLength } from 'class-validator';

export class CreateDisputeDto {
  @IsInt()
  orderId: number;

  @IsString()
  @MinLength(10)
  message: string;
}
