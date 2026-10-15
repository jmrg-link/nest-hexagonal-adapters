import type { CrudRepository } from '../../shared/domain/crud.repository';
import type { User } from './user';
import type { UserCriteria } from './user.criteria';

/** Puerto de salida para persistir usuarios; lo implementa cada adaptador de BBDD. */
export interface UserRepository extends CrudRepository<User, UserCriteria> {
  /**
   * Busca por email ya normalizado en minúsculas.
   * @param email Email normalizado.
   * @returns El usuario o `null`.
   */
  findByEmail(email: string): Promise<User | null>;
}

/** Token de inyección del puerto: las interfaces no existen en tiempo de ejecución. */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
