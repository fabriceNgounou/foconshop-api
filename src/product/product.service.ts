import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  /* -------------------------------------------------------------------------- */
  /*                               UTILITAIRE SLUG                               */
  /* -------------------------------------------------------------------------- */

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private buildSlug(title: string, productId: number): string {
  return `${this.slugify(title)}-${productId}`;
}

  /* -------------------------------------------------------------------------- */
  /*                                   CREATE                                   */
  /* -------------------------------------------------------------------------- */

  async create(vendorId: number, dto: CreateProductDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // 1️⃣ création sans slug (id encore inconnu)
    const product = await this.prisma.product.create({
      data: {
        title: dto.title,
        description: dto.description,
        vendorId,
        categoryId: dto.categoryId,
      },
    });

    // 2️⃣ génération du slug après création
    const slug = this.buildSlug(product.title, product.id);

    await this.prisma.product.update({
      where: { id: product.id },
      data: { slug },
    });

    return {
      ...product,
      slug,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                                READ VENDOR                                 */
  /* -------------------------------------------------------------------------- */

  async findMyProducts(vendorProfileId: number) {
    if (!vendorProfileId) {
      throw new BadRequestException('Vendor ID is required');
    }

    return this.prisma.product.findMany({
      where: { vendorId: vendorProfileId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyProductsByUser(userId: number) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new ForbiddenException('User is not a vendor');
    }

    return this.prisma.product.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOnePublic(productId: number) {
  const product = await this.prisma.product.findUnique({
    where: { id: productId },
    include: {
      vendor: {
        select: {
          id: true,
          status: true,
          codeUnique: true,
          businessName: true,
        },
      },
    },
  });

  if (!product) {
    throw new NotFoundException('Product not found');
  }

  return product;
}


  /* -------------------------------------------------------------------------- */
  /*                                   UPDATE                                   */
  /* -------------------------------------------------------------------------- */

  async update(
    productId: number,
    vendorProfileId: number,
    dto: UpdateProductDto,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.vendorId !== vendorProfileId) {
      throw new ForbiddenException('You cannot update this product');
    }

    const titleChanged =
      dto.title !== undefined && dto.title !== product.title;

    let newSlug: string | undefined;

    if (titleChanged || !product.slug) {
      newSlug = this.buildSlug(dto.title ?? product.title, product.id);

      if (product.slug) {
        await this.prisma.productSlugHistory.create({
          data: {
            productId: product.id,
            slug: product.slug,
          },
        });
      }
    }
  return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...dto,
        ...(newSlug ? { slug: newSlug } : {}),
      },
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                                   DELETE                                   */
  /* -------------------------------------------------------------------------- */

  async remove(productId: number, vendorProfileId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: {
            OrderItem: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.vendorId !== vendorProfileId) {
      throw new ForbiddenException('You cannot delete this product');
    }

    const hasOrders = product.variants.some(
      (variant) => variant.OrderItem.length > 0,
    );

    if (hasOrders) {
      throw new BadRequestException(
        'Impossible de supprimer un produit déjà commandé',
      );
    }

    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                                 PUBLIC READ                                */
  /* -------------------------------------------------------------------------- */

  async findAllPublic() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        vendor: {
          select: {
            id: true,
            status: true,
            businessName: true,
          },
        },
      },
    });
  }

  async findOnePublicBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        vendor: {
          select: {
            id: true,
            status: true,
            codeUnique: true,
            businessName: true,
          },
        },
      },
    });

    if (product) return product;

    // 🔁 recherche dans l'historique
    const history = await this.prisma.productSlugHistory.findUnique({
      where: { slug },
      include: { product: true },
    });

    if (!history) {
      throw new NotFoundException('Product not found');
    }

    return {
      redirectTo: history.product.slug,
    };
  }
}