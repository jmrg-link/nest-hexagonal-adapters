import { Inject, Injectable } from '@nestjs/common';
import type { Principal } from '../../shared/domain/principal';
import { UsersService } from '../../users/application/users.service';
import type { User } from '../../users/domain/user';
import { InvalidCredentialsError } from '../domain/auth.errors';
import { PASSWORD_HASHER, type PasswordHasher } from '../domain/password-hasher.port';
import { TOKEN_SERVICE, type IssuedToken, type TokenService } from '../domain/token-service.port';
import type { LoginDto, RegisterDto } from './auth.schemas';

/**
 * Casos de uso de autenticación: registro, login y perfil propio.
 * Reutiliza UsersService para no duplicar las reglas de alta (DRY).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  /**
   * Registra una cuenta de cliente.
   * @param dto Datos validados.
   * @returns Usuario creado.
   */
  register(dto: RegisterDto): Promise<User> {
    return this.users.create({ ...dto, role: 'customer' });
  }

  /**
   * Comprueba credenciales y emite un JWT. El error es el mismo si falla el email
   * o la contraseña, para no revelar qué cuentas existen.
   * @param dto Credenciales validadas.
   * @returns Token de acceso.
   * @throws {InvalidCredentialsError} Si no coinciden.
   */
  async login(dto: LoginDto): Promise<IssuedToken> {
    const user = await this.users.findByEmail(dto.email);
    const valid = user !== null && (await this.hasher.verify(dto.password, user.passwordHash));
    if (!user || !valid) {
      throw new InvalidCredentialsError();
    }
    return this.tokens.issue({ userId: user.id, email: user.email, role: user.role });
  }

  /**
   * Devuelve el perfil de la identidad autenticada.
   * @param principal Identidad del token.
   * @returns Usuario.
   */
  me(principal: Principal): Promise<User> {
    return this.users.findById(principal.userId, principal);
  }
}
