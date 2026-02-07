import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  /* 🔓 Public – list categories */
  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /* 🔐 Admin – create category */
  async create(name: string) {
    const slug = this.slugify(name);

    return this.prisma.category.create({
      data: {
        name,
        slug,
      },
    });
  }

  /* 🔐 Admin – update category */
  async update(id: number, name: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const slug = this.slugify(name);

    return this.prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
      },
    });
  }

  /* 🔐 Admin – delete category */
  async remove(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
