import {
  createParamDecorator,
  type CustomDecorator,
  type ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Principal, Role } from '../../shared/domain/principal';
import { getRequest } from '../../shared/presentation/request-context';
import { InvalidTokenError } from '../domain/auth.errors';

/** Clave de metadatos de las rutas públicas. */
export const IS_PUBLIC_KEY = 'auth:isPublic';

/** Clave de metadatos de los roles exigidos. */
export const ROLES_KEY = 'auth:roles';

/**
 * Marca un handler como público: JwtAuthGuard no exigirá token.
 * @returns Decorador de metadatos.
 */
export const Public = (): CustomDecorator<string> => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Restringe un handler a los roles indicados; lo comprueba RolesGuard.
 * @param roles Roles permitidos.
 * @returns Decorador de metadatos.
 */
export const Roles = (...roles: Role[]): CustomDecorator<string> => SetMetadata(ROLES_KEY, roles);

/**
 * Inyecta la identidad autenticada, igual en REST que en GraphQL. Si falta, el
 * handler se marcó público por error y se responde 401 en lugar de seguir sin identidad.
 */
export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Principal => {
    const principal = getRequest(context).principal;
    if (!principal) {
      throw new InvalidTokenError();
    }
    return principal;
  },
);
