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
import { RegisterDto } from './dto/register.dto';
import { InitiateRegisterDto } from './dto/initiate-register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ========== INSCRIPTION ==========
  @Post('register/initiate')
  async initiateRegister(@Body() dto: InitiateRegisterDto) {
    return this.authService.initiateRegister(dto);
  }

  @Post('register/verify')
  async verifyOtpAndRegister(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtpAndRegister(dto);
  }

  @Post('register/resend-otp')
  async resendOtp(@Body('email') email: string) {
    return this.authService.resendOtp(email);
  }

  // ========== CONNEXION ==========
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

  // ========== RÉINITIALISATION MOT DE PASSE ==========
  
  /**
   * Étape 1 : Demander un code de réinitialisation
   */
  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  /**
   * Étape 2 (optionnelle) : Vérifier le code avant de réinitialiser
   */
  @Post('password/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(dto);
  }

  /**
   * Étape 3 : Réinitialiser le mot de passe
   */
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  /**
   * Renvoyer le code de réinitialisation
   */
  @Post('password/resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendResetOtp(@Body('email') email: string) {
    return this.authService.resendResetOtp(email);
  }
}