import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { LoyaltySource } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  private async hashPassword(password: string) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async comparePassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  /**
   * REGISTER
   */
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new BadRequestException('Username already in use');
    }

    const hashed = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        phone: dto.phone ?? null,
        password: hashed,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // ⭐ BONUS D’INSCRIPTION
    await this.loyaltyService.addPoints(
      user.id,
      250,
      LoyaltySource.SIGNUP,
      `SIGNUP_${user.id}`,
    );

    return { user };
  }

  /**
   * VALIDATE USER (Passport)
   */
  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) return null;

    const matched = await this.comparePassword(
      pass,
      user.password,
    );

    if (!matched) return null;

    const { password, ...rest } = user as any;
    return rest;
  }

  /**
   * LOGIN
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        vendor: true, // 👈 nécessaire
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const valid = await this.comparePassword(
      dto.password,
      user.password,
    );

    if (!valid) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    // ✅ vendorId UNIQUEMENT si APPROVED
    const vendorId =
      user.vendor &&
      user.vendor.status === 'APPROVED'
        ? user.vendor.id
        : null;

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      vendorId,
    };

    const accessToken =
      this.jwtService.sign(payload);

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
