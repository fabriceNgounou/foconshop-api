import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(vendorId: number, dto: CreateProductDto) {
    // 1️⃣ vérifier que la catégorie existe
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // 2️⃣ créer le produit
    return this.prisma.product.create({
      data: {
        title: dto.title,
        description: dto.description,
        vendorId,
        categoryId: dto.categoryId,
      },
    });
  }


  async findMyProducts(vendorProfileId: number) {
    return this.prisma.product.findMany({
      where: { vendorId: vendorProfileId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(productId: number, vendorProfileId: number, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.vendorId !== vendorProfileId) {
      throw new ForbiddenException('You cannot update this product');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: dto,
    });
  }

  async remove(productId: number, vendorProfileId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.vendorId !== vendorProfileId) {
      throw new ForbiddenException('You cannot delete this product');
    }

    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  /* 🔓 PUBLIC – LIST PRODUCTS */
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
          },
        },
      },
    });
  }

// src/product/product.service.ts

async findOnePublic(productId: number) {
  const product = await this.prisma.product.findUnique({
    where: { id: productId },
    include: {
      vendor: {
        select: {
          id: true,
          status: true,
          codeUnique: true,
        },
      },
    },
  });

  if (!product) {
    throw new NotFoundException('Product not found');
  }

  return product;
}


}
