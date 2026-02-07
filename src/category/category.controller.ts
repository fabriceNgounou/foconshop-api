import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';

import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';

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
    return this.categoryService.create(dto.name);
  }

  /* ===========================
     🔐 ADMIN – UPDATE CATEGORY
     =========================== */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoryService.update(Number(id), dto.name);
  }

  /* ===========================
     🔐 ADMIN – DELETE CATEGORY
     =========================== */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.categoryService.remove(Number(id));
  }
}
