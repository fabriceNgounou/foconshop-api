import { IsInt, Min } from 'class-validator';

export class SpendPointsDto {
  @IsInt()
  @Min(1)
  points: number;
}
