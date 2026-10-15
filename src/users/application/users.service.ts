import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PASSWORD_HASHER, type PasswordHasher } from '../../auth/domain/password-hasher.port';
import { AccessDeniedError } from '../../shared/domain/domain-error';
import type { Page } from '../../shared/domain/page';
import { assertCanAccess, isAdmin, type Principal } from '../../shared/domain/principal';
import { User } from '../domain/user';
import { EmailAlreadyInUseError, UserNotFoundError } from '../domain/user.errors';
import { USER_REPOSITORY, type UserRepository } from '../domain/user.repository';
import type { CreateUserDto, ListUsersQuery, UpdateUserDto } from './user.schemas';

/**
 * Casos de uso de usuarios. Depende solo de puertos (UserRepository, PasswordHasher):
 * no sabe qué base de datos ni qué algoritmo de hash hay detrás (DIP).
 * REST y GraphQL llaman a estos mismos métodos, así la lógica no se duplica.
 */
@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  /**
   * Da de alta un usuario con la contraseña ya hasheada.
   * @param dto Datos validados.
   * @returns Usuario creado.
   * @throws {EmailAlreadyInUseError} Si el email existe.
   */
  async create(dto: CreateUserDto): Promise<User> {
    await this.assertEmailAvailable(dto.email);
    const user = User.create({
      id: randomUUID(),
      email: dto.email,
      name: dto.name,
      role: dto.role,
      passwordHash: await this.hasher.hash(dto.password),
    });
    await this.users.create(user);
    return user;
  }

  /**
   * Lista usuarios con filtros y paginación (solo administración).
   * @param query Filtros validados.
   * @returns Página de usuarios.
   */
  list(query: ListUsersQuery): Promise<Page<User>> {
    return this.users.search(query);
  }

  /**
   * Devuelve un usuario si quien pregunta es él mismo o un administrador.
   * @param id Usuario solicitado.
   * @param principal Identidad autenticada.
   * @returns Usuario.
   */
  async findById(id: string, principal: Principal): Promise<User> {
    assertCanAccess(principal, id);
    return this.getOrFail(id);
  }

  /**
   * Busca por email; lo usa el login.
   * @param email Email normalizado.
   * @returns Usuario o `null`.
   */
  findByEmail(email: string): Promise<User | null> {
    return this.users.findByEmail(email);
  }

  /**
   * Edita un usuario. Solo un administrador puede cambiar roles.
   * @param id Usuario a editar.
   * @param dto Cambios validados.
   * @param principal Identidad autenticada.
   * @returns Usuario actualizado.
   */
  async update(id: string, dto: UpdateUserDto, principal: Principal): Promise<User> {
    assertCanAccess(principal, id);
    if (dto.role && !isAdmin(principal)) {
      throw new AccessDeniedError();
    }
    const user = await this.getOrFail(id);
    if (dto.email && dto.email !== user.email) {
      await this.assertEmailAvailable(dto.email);
      user.changeEmail(dto.email);
    }
    if (dto.name) {
      user.rename(dto.name);
    }
    if (dto.role) {
      user.changeRole(dto.role);
    }
    if (dto.password) {
      user.changePasswordHash(await this.hasher.hash(dto.password));
    }
    await this.users.update(user);
    return user;
  }

  /**
   * Elimina un usuario. Sus pedidos se conservan: referencian al usuario por id.
   * @param id Usuario a eliminar.
   * @throws {UserNotFoundError} Si no existe.
   */
  async remove(id: string): Promise<void> {
    if (!(await this.users.delete(id))) {
      throw new UserNotFoundError(id);
    }
  }

  private async getOrFail(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }
    return user;
  }

  private async assertEmailAvailable(email: string): Promise<void> {
    if (await this.users.findByEmail(email)) {
      throw new EmailAlreadyInUseError(email);
    }
  }
}
