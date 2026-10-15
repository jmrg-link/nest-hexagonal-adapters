import { Inject, Injectable } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import { z } from 'zod';
import { APP_CONFIG, type AppConfig } from '../../config/app-config';
import { ROLES, type Principal } from '../../shared/domain/principal';
import { InvalidTokenError } from '../domain/auth.errors';
import type { IssuedToken, TokenService } from '../domain/token-service.port';

const ALGORITHM = 'HS256';

const claimsSchema = z.object({
  sub: z.uuid(),
  email: z.email(),
  role: z.enum(ROLES),
});

/**
 * Adaptador del puerto TokenService con la librería `jsonwebtoken`.
 * - Fija el algoritmo al verificar (evita ataques de confusión `alg`/`none`).
 * - Comprueba emisor, audiencia y caducidad.
 * - Valida la forma de los claims con Zod antes de confiar en ellos.
 */
@Injectable()
export class JsonWebTokenService implements TokenService {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async issue(principal: Principal): Promise<IssuedToken> {
    const { secret, expiresInSeconds, issuer, audience } = this.config.jwt;
    const accessToken = sign({ email: principal.email, role: principal.role }, secret, {
      algorithm: ALGORITHM,
      subject: principal.userId,
      expiresIn: expiresInSeconds,
      issuer,
      audience,
    });
    return { accessToken, tokenType: 'Bearer', expiresIn: expiresInSeconds };
  }

  async verify(token: string): Promise<Principal> {
    const { secret, issuer, audience } = this.config.jwt;
    try {
      const payload = verify(token, secret, { algorithms: [ALGORITHM], issuer, audience });
      const claims = claimsSchema.parse(payload);
      return { userId: claims.sub, email: claims.email, role: claims.role };
    } catch {
      throw new InvalidTokenError();
    }
  }
}
