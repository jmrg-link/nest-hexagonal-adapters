import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Principal } from '../../../shared/domain/principal';
import { userViewSchema, type UserView } from '../../../users/application/user.schemas';
import { toUserView } from '../../../users/presentation/user.presenter';
import {
  loginSchema,
  registerSchema,
  tokenViewSchema,
  type LoginDto,
  type RegisterDto,
  type TokenView,
} from '../../application/auth.schemas';
import { AuthService } from '../../application/auth.service';
import { CurrentPrincipal, Public } from '../auth.decorators';

/** Adaptador de entrada REST para autenticación (registro, login y perfil). */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiCreatedResponse({ description: 'Cuenta de cliente creada', standardSchema: userViewSchema })
  @ApiConflictResponse({ description: 'El email ya está registrado' })
  async register(@Body({ schema: registerSchema }) dto: RegisterDto): Promise<UserView> {
    return toUserView(await this.auth.register(dto));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'JWT de acceso', standardSchema: tokenViewSchema })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  login(@Body({ schema: loginSchema }) dto: LoginDto): Promise<TokenView> {
    return this.auth.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Perfil de la identidad autenticada',
    standardSchema: userViewSchema,
  })
  async me(@CurrentPrincipal() principal: Principal): Promise<UserView> {
    return toUserView(await this.auth.me(principal));
  }
}
