import { Global, Module } from '@nestjs/common';
import { PASSWORD_HASHER } from '../domain/password-hasher.port';
import { TOKEN_SERVICE } from '../domain/token-service.port';
import { JsonWebTokenService } from './jsonwebtoken-token.service';
import { ScryptPasswordHasher } from './scrypt-password.hasher';

/**
 * Enlaza los puertos de seguridad con sus adaptadores. Es global porque los
 * consumen varios módulos (usuarios para hashear, auth para emitir y verificar).
 */
@Global()
@Module({
  providers: [
    { provide: TOKEN_SERVICE, useClass: JsonWebTokenService },
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
  ],
  exports: [TOKEN_SERVICE, PASSWORD_HASHER],
})
export class SecurityModule {}
