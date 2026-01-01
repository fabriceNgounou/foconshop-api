// src/address/address.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  create(userId: number, dto: CreateAddressDto) {
    return this.prisma.address.create({
      data: {
        userId,
        fullName: dto.fullName,
        phone: dto.phone,
        addressLine: dto.addressLine,
        city: dto.city,
        country: dto.country,
      },
    });
  }

  findMyAddresses(userId: number) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
