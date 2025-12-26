import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;
}
