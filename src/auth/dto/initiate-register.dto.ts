import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class InitiateRegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @MinLength(6)
  password: string;
}