import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentPrincipal, Roles } from '../../../auth/presentation/auth.decorators';
import { idSchema } from '../../../shared/application/pagination.schemas';
import { mapPage, type Page } from '../../../shared/domain/page';
import type { Principal } from '../../../shared/domain/principal';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userPageViewSchema,
  userViewSchema,
  type CreateUserDto,
  type ListUsersQuery,
  type UpdateUserDto,
  type UserView,
} from '../../application/user.schemas';
import { UsersService } from '../../application/users.service';
import { toUserView } from '../user.presenter';

/**
 * Adaptador de entrada REST para usuarios. Solo traduce HTTP ↔ casos de uso:
 * valida con Zod (opción `schema` de NestJS 12), delega y presenta.
 */
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  @Roles('admin')
  @ApiCreatedResponse({ description: 'Usuario creado', standardSchema: userViewSchema })
  async create(@Body({ schema: createUserSchema }) dto: CreateUserDto): Promise<UserView> {
    return toUserView(await this.users.create(dto));
  }

  @Get()
  @Roles('admin')
  @ApiOkResponse({ description: 'Página de usuarios', standardSchema: userPageViewSchema })
  async list(
    @Query({ schema: listUsersQuerySchema }) query: ListUsersQuery,
  ): Promise<Page<UserView>> {
    return mapPage(await this.users.list(query), toUserView);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Usuario', standardSchema: userViewSchema })
  async findOne(
    @Param('id', { schema: idSchema }) id: string,
    @CurrentPrincipal() principal: Principal,
  ): Promise<UserView> {
    return toUserView(await this.users.findById(id, principal));
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Usuario actualizado', standardSchema: userViewSchema })
  async update(
    @Param('id', { schema: idSchema }) id: string,
    @Body({ schema: updateUserSchema }) dto: UpdateUserDto,
    @CurrentPrincipal() principal: Principal,
  ): Promise<UserView> {
    return toUserView(await this.users.update(id, dto, principal));
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Usuario eliminado' })
  async remove(@Param('id', { schema: idSchema }) id: string): Promise<void> {
    await this.users.remove(id);
  }
}
