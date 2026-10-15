import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentPrincipal, Roles } from '../../../auth/presentation/auth.decorators';
import { idSchema } from '../../../shared/application/pagination.schemas';
import { mapPage, type Page } from '../../../shared/domain/page';
import type { Principal } from '../../../shared/domain/principal';
import { ArgsSchemaPipe } from '../../../shared/presentation/validation';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  type CreateUserDto,
  type ListUsersQuery,
  type UpdateUserDto,
  type UserView,
} from '../../application/user.schemas';
import { UsersService } from '../../application/users.service';
import { toUserView } from '../user.presenter';
import {
  CreateUserInput,
  UpdateUserInput,
  UserFilterInput,
  UserPageType,
  UserType,
} from './user.types';

/**
 * Adaptador de entrada GraphQL para usuarios: mismas operaciones, mismos esquemas
 * Zod y mismo servicio que el controlador REST. Solo cambia el transporte.
 */
@Resolver(() => UserType)
export class UsersResolver {
  constructor(private readonly users: UsersService) {}

  @Mutation(() => UserType, { description: 'Alta de usuario (admin)' })
  @Roles('admin')
  async createUser(
    @Args('input', { type: () => CreateUserInput }, new ArgsSchemaPipe(createUserSchema))
    input: CreateUserDto,
  ): Promise<UserView> {
    return toUserView(await this.users.create(input));
  }

  @Query(() => UserPageType, { name: 'users', description: 'Listado paginado (admin)' })
  @Roles('admin')
  async list(
    @Args(
      'filter',
      { type: () => UserFilterInput, nullable: true, defaultValue: {} },
      new ArgsSchemaPipe(listUsersQuerySchema),
    )
    filter: ListUsersQuery,
  ): Promise<Page<UserView>> {
    return mapPage(await this.users.list(filter), toUserView);
  }

  @Query(() => UserType, { name: 'user', description: 'Usuario propio o cualquiera (admin)' })
  async findOne(
    @Args('id', { type: () => ID }, new ArgsSchemaPipe(idSchema)) id: string,
    @CurrentPrincipal() principal: Principal,
  ): Promise<UserView> {
    return toUserView(await this.users.findById(id, principal));
  }

  @Mutation(() => UserType, { description: 'Edición parcial; el rol solo lo cambia admin' })
  async updateUser(
    @Args('id', { type: () => ID }, new ArgsSchemaPipe(idSchema)) id: string,
    @Args('input', { type: () => UpdateUserInput }, new ArgsSchemaPipe(updateUserSchema))
    input: UpdateUserDto,
    @CurrentPrincipal() principal: Principal,
  ): Promise<UserView> {
    return toUserView(await this.users.update(id, input, principal));
  }

  @Mutation(() => Boolean, { description: 'Baja de usuario (admin)' })
  @Roles('admin')
  async deleteUser(
    @Args('id', { type: () => ID }, new ArgsSchemaPipe(idSchema)) id: string,
  ): Promise<boolean> {
    await this.users.remove(id);
    return true;
  }
}
