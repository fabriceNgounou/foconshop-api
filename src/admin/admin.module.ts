// src/media/media.module.ts
import { Module } from '@nestjs/common';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';
import { AdminDisputesController } from './disputes/admin-disputes.controller';
import {AdminDisputesService } from './disputes/admin-disputes.service';
// import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AdminUsersController, AdminDisputesController],
  providers: [AdminUsersService, AdminDisputesService, PrismaService],
})
export class AdminModule {}