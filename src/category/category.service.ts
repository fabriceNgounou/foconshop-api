// ========================================
// VERSION COMPATIBLE : category.service.ts
// Conserve l'ancienne API + ajoute les nouvelles fonctionnalités
// ========================================

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  private readonly MAX_LEVEL = 4;

  constructor(private prisma: PrismaService) {}

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  /* -------------------------------------------------------------------------- */
  /*                    MÉTHODES EXISTANTES (COMPATIBLES)                      */
  /* -------------------------------------------------------------------------- */

  /**
   * ✅ COMPATIBLE : findAll() retourne maintenant la liste PLATE par défaut
   * Pour avoir l'arbre, utiliser findAllTree()
   */
  async findAll() {
    // ✅ Retourne une liste plate pour compatibilité avec l'ancien code
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: true,
            vendors: true,
          },
        },
      },
    });
  }

  /**
   * ✅ COMPATIBLE : create() accepte maintenant un parentId optionnel
   */
  async create(name: string, parentId?: number) {
    const slug = this.slugify(name);
    let level = 1;

    if (parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }

      level = parent.level + 1;

      if (level > this.MAX_LEVEL) {
        throw new BadRequestException(
          `Maximum category depth is ${this.MAX_LEVEL} levels`
        );
      }
    }

    // ✅ Vérifier l'unicité du slug
    const existing = await this.prisma.category.findFirst({
      where: {
        slug,
        parentId: parentId || null,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `A category with slug "${slug}" already exists`
      );
    }

    return this.prisma.category.create({
      data: {
        name,
        slug,
        level,
        parentId: parentId || null,
      },
    });
  }

  /**
   * ✅ COMPATIBLE : update() accepte maintenant un parentId optionnel
   */
  async update(id: number, name: string, parentId?: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const slug = this.slugify(name);
    let level = category.level;

    // Si parentId est fourni et différent, recalculer le niveau
    if (parentId !== undefined && parentId !== category.parentId) {
      if (parentId) {
        const newParent = await this.prisma.category.findUnique({
          where: { id: parentId },
        });

        if (!newParent) {
          throw new NotFoundException('New parent category not found');
        }

        if (parentId === id) {
          throw new BadRequestException('A category cannot be its own parent');
        }

        level = newParent.level + 1;

        const maxChildDepth = await this.getMaxChildDepth(id);
        if (level + maxChildDepth > this.MAX_LEVEL) {
          throw new BadRequestException(
            `Moving this category would exceed maximum depth of ${this.MAX_LEVEL} levels`
          );
        }
      } else {
        level = 1;
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        level,
        parentId: parentId !== undefined ? parentId : category.parentId,
      },
    });

    if (level !== category.level) {
      await this.updateChildrenLevels(id, level);
    }

    return updated;
  }

  /**
   * ✅ COMPATIBLE : remove() inchangé
   */
  async remove(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: true,
        vendors: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.children && category.children.length > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${category.children.length} subcategories`
      );
    }

    if (category.products.length > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${category.products.length} products`
      );
    }

    if (category.vendors.length > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${category.vendors.length} vendors`
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                    NOUVELLES MÉTHODES (FONCTIONNALITÉS AVANCÉES)         */
  /* -------------------------------------------------------------------------- */

  /**
   * ✅ NOUVELLE : Arbre hiérarchique
   */
  async findAllTree() {
    return this.prisma.category.findMany({
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
            vendors: true,
          },
        },
      },
      where: { parentId: null },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * ✅ NOUVELLE : Liste plate avec breadcrumb
   */
  async findAllFlat() {
    const categories = await this.prisma.category.findMany({
      include: {
        parent: {
          include: {
            parent: {
              include: {
                parent: true,
              },
            },
          },
        },
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' },
      ],
    });

    return categories.map(cat => ({
      ...cat,
      breadcrumb: this.getBreadcrumb(cat),
    }));
  }

  /**
   * ✅ NOUVELLE : Récupérer par slug
   */
  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: true,
        parent: true,
        _count: {
          select: {
            products: true,
            vendors: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * ✅ NOUVELLE : Récupérer les enfants
   */
  async getChildren(parentId: number) {
    return this.prisma.category.findMany({
      where: { parentId },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                            HELPER METHODS                                  */
  /* -------------------------------------------------------------------------- */

  private async getMaxChildDepth(categoryId: number): Promise<number> {
    const children = await this.prisma.category.findMany({
      where: { parentId: categoryId },
      select: { id: true },
    });

    if (children.length === 0) return 0;

    const depths = await Promise.all(
      children.map(child => this.getMaxChildDepth(child.id))
    );

    return 1 + Math.max(...depths);
  }

  private async updateChildrenLevels(
    categoryId: number,
    parentLevel: number
  ): Promise<void> {
    const children = await this.prisma.category.findMany({
      where: { parentId: categoryId },
    });

    for (const child of children) {
      const newLevel = parentLevel + 1;

      await this.prisma.category.update({
        where: { id: child.id },
        data: { level: newLevel },
      });

      await this.updateChildrenLevels(child.id, newLevel);
    }
  }

  private getBreadcrumb(category: any): string {
    const parts: string[] = [];
    let current = category;

    while (current) {
      parts.unshift(current.name);
      current = current.parent;
    }

    return parts.join(' > ');
  }
}