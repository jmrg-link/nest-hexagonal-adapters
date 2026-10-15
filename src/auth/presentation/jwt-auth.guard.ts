import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getRequest } from '../../shared/presentation/request-context';
import { InvalidTokenError } from '../domain/auth.errors';
import { TOKEN_SERVICE, type TokenService } from '../domain/token-service.port';
import { IS_PUBLIC_KEY } from './auth.decorators';

const BEARER = 'bearer';

const extractBearerToken = (header: string | undefined): string | undefined => {
  const [scheme, token] = header?.split(' ') ?? [];
  return scheme?.toLowerCase() === BEARER && token ? token : undefined;
};

/**
 * Guard global de autenticación (seguro por defecto): toda operación REST o
 * GraphQL exige un JWT salvo las marcadas con `@Public()`. Si el token es válido,
 * deja la identidad en `request.principal` para los siguientes eslabones.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublic(context)) {
      return true;
    }
    const request = getRequest(context);
    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new InvalidTokenError();
    }
    request.principal = await this.tokens.verify(token);
    return true;
  }

  private isPublic(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }
}
