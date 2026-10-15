import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Principal } from '../../../shared/domain/principal';
import { ArgsSchemaPipe } from '../../../shared/presentation/validation';
import type { UserView } from '../../../users/application/user.schemas';
import { UserType } from '../../../users/presentation/graphql/user.types';
import { toUserView } from '../../../users/presentation/user.presenter';
import {
  loginSchema,
  registerSchema,
  type LoginDto,
  type RegisterDto,
  type TokenView,
} from '../../application/auth.schemas';
import { AuthService } from '../../application/auth.service';
import { CurrentPrincipal, Public } from '../auth.decorators';
import { AccessTokenType, LoginInput, RegisterInput } from './auth.types';

/** Adaptador de entrada GraphQL para autenticación; espejo del controlador REST. */
@Resolver()
export class AuthResolver {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Mutation(() => UserType, { description: 'Registro público de clientes' })
  async register(
    @Args('input', { type: () => RegisterInput }, new ArgsSchemaPipe(registerSchema))
    input: RegisterDto,
  ): Promise<UserView> {
    return toUserView(await this.auth.register(input));
  }

  @Public()
  @Mutation(() => AccessTokenType, { description: 'Devuelve un JWT de acceso' })
  login(
    @Args('input', { type: () => LoginInput }, new ArgsSchemaPipe(loginSchema)) input: LoginDto,
  ): Promise<TokenView> {
    return this.auth.login(input);
  }

  @Query(() => UserType, { description: 'Perfil de la identidad autenticada' })
  async me(@CurrentPrincipal() principal: Principal): Promise<UserView> {
    return toUserView(await this.auth.me(principal));
  }
}
