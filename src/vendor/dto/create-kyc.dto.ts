import { IsString, IsNotEmpty } from 'class-validator';

export class CreateKycDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  url: string;
}
