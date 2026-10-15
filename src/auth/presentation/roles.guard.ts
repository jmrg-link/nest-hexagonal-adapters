import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessDeniedError } from '../../shared/domain/domain-error';
import type { Role } from '../../shared/domain/principal';
import { getRequest } from '../../shared/presentation/request-context';
import { ROLES_KEY } from './auth.decorators';

/**
 * Guard global de autorización por rol (RBAC). Se ejecuta después de
 * JwtAuthGuard; la autorización por propiedad del recurso vive en la aplicación.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) {
      return true;
    }
    const principal = getRequest(context).principal;
    if (!principal || !roles.includes(principal.role)) {
      throw new AccessDeniedError();
    }
    return true;
  }
}
