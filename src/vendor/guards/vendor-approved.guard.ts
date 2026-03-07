import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VendorStatus } from '@prisma/client';

@Injectable()
export class VendorApprovedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.vendorId) {
      throw new ForbiddenException('Vendor profile required');
    }

    // ✅ CORRECTION : Vérifier que la boutique existe ET est approuvée
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: user.vendorId },
    });

    if (!vendor) {
      throw new ForbiddenException('Vendor profile not found');
    }

    if (vendor.status !== VendorStatus.APPROVED) {
      throw new ForbiddenException('Vendor account is not approved');
    }

    // ✅ BONUS : Attacher les infos du vendeur à la requête pour usage ultérieur
    request.vendor = vendor;

    return true;
  }
}