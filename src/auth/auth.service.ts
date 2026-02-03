import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitiateRegisterDto } from './dto/initiate-register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { LoyaltySource } from '@prisma/client';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly loyaltyService: LoyaltyService,
    private readonly emailService: EmailService,
  ) {}

  private async hashPassword(password: string) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async comparePassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * ÉTAPE 1 : Initier l'inscription et envoyer l'OTP
   */
  async initiateRegister(dto: InitiateRegisterDto) {
    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // Vérifier si le username existe déjà
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new BadRequestException('Username already in use');
    }

    // Générer l'OTP
    const otpCode = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hasher le mot de passe
    const hashedPassword = await this.hashPassword(dto.password);

    // Supprimer toute tentative précédente avec cet email
    await this.prisma.pendingRegistration.deleteMany({
      where: { email: dto.email },
    });

    // Créer l'enregistrement temporaire
    await this.prisma.pendingRegistration.create({
      data: {
        email: dto.email,
        username: dto.username,
        phone: dto.phone,
        password: hashedPassword,
        otpCode,
        otpExpiry,
      },
    });

    // Envoyer l'OTP par email
    await this.emailService.sendOtpEmail(dto.email, otpCode);

    return {
      message: 'OTP sent to your email',
      email: dto.email,
    };
  }

  /**
   * ÉTAPE 2 : Vérifier l'OTP et créer le compte
   */
  async verifyOtpAndRegister(dto: VerifyOtpDto) {
    // Récupérer l'enregistrement temporaire
    const pending = await this.prisma.pendingRegistration.findUnique({
      where: { email: dto.email },
    });

    if (!pending) {
      throw new BadRequestException('No pending registration found');
    }

    // Vérifier si l'OTP a expiré
    if (new Date() > pending.otpExpiry) {
      await this.prisma.pendingRegistration.delete({
        where: { email: dto.email },
      });
      throw new BadRequestException('OTP has expired');
    }

    // Vérifier le code OTP
    if (pending.otpCode !== dto.otpCode) {
      throw new BadRequestException('Invalid OTP code');
    }

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        username: pending.username,
        email: pending.email,
        phone: pending.phone,
        password: pending.password, // Déjà hashé
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Supprimer l'enregistrement temporaire
    await this.prisma.pendingRegistration.delete({
      where: { email: dto.email },
    });

    // Ajouter les points de fidélité
    await this.loyaltyService.addPoints(
      user.id,
      250,
      LoyaltySource.SIGNUP,
      `SIGNUP_${user.id}`,
    );

    return { 
      message: 'Account created successfully',
      user 
    };
  }

  /**
   * RENVOYER L'OTP
   */
  async resendOtp(email: string) {
    const pending = await this.prisma.pendingRegistration.findUnique({
      where: { email },
    });

    if (!pending) {
      throw new BadRequestException('No pending registration found');
    }

    // Générer un nouveau code
    const otpCode = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Mettre à jour
    await this.prisma.pendingRegistration.update({
      where: { email },
      data: { otpCode, otpExpiry },
    });

    // Renvoyer l'email
    await this.emailService.sendOtpEmail(email, otpCode);

    return { message: 'OTP resent successfully' };
  }

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) return null;
    const matched = await this.comparePassword(pass, user.password);
    if (!matched) return null;
    const { password, ...rest } = user as any;
    return rest;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        vendor: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await this.comparePassword(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const vendorId =
      user.vendor && user.vendor.status === 'APPROVED'
        ? user.vendor.id
        : null;
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      vendorId,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      access_token: accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        vendorId,
      },
    };
  }
}