// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const user = request.user;
    if (!user) return false;

    // user.role expected to be string like 'CLIENT' | 'VENDOR' | 'ADMIN'
    return requiredRoles.includes(user.role);
  }
}
