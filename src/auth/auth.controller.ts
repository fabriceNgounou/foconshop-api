import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { InitiateRegisterDto } from './dto/initiate-register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Nouvelle route : Initier l'inscription
   */
  @Post('register/initiate')
  async initiateRegister(@Body() dto: InitiateRegisterDto) {
    return this.authService.initiateRegister(dto);
  }

  /**
   * Nouvelle route : Vérifier l'OTP et créer le compte
   */
  @Post('register/verify')
  async verifyOtpAndRegister(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtpAndRegister(dto);
  }

  /**
   * Nouvelle route : Renvoyer l'OTP
   */
  @Post('register/resend-otp')
  async resendOtp(@Body('email') email: string) {
    return this.authService.resendOtp(email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return req.user;
  }
}