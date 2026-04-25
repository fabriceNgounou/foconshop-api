import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto'; // ✅ Import
import { UpdateCategoryDto } from './dto/update-category.dto'; // ✅ Import
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /* ===========================
     🔓 PUBLIC – LIST CATEGORIES
     =========================== */
  @Get()
  async findAll() {
    return this.categoryService.findAll();
  }

  /* ===========================
     🔐 ADMIN – CREATE CATEGORY
     =========================== */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto.name, dto.parentId);
  }

  /* ===========================
     🔐 ADMIN – UPDATE CATEGORY
     =========================== */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto, // ✅ UpdateCategoryDto
  ) {
    return this.categoryService.update(id, dto.name, dto.parentId);
  }

  /* ===========================
     🔐 ADMIN – DELETE CATEGORY
     =========================== */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }

  /* ===========================
     ✅ NOUVELLES ROUTES (BONUS)
     =========================== */

  @Get('tree')
  async findAllTree() {
    return this.categoryService.findAllTree();
  }

  @Get('flat')
  async findAllFlat() {
    return this.categoryService.findAllFlat();
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }

  @Get(':id/children')
  async getChildren(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.getChildren(id);
  }
}