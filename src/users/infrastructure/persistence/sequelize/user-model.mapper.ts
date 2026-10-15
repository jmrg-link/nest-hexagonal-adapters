import { User, type UserSnapshot } from '../../../domain/user';
import type { UserModel } from './user.model';

/**
 * Data Mapper dominio → atributos Sequelize (camelCase; `underscored` los
 * traduce a snake_case en la tabla).
 * @param user Agregado de dominio.
 * @returns Atributos del modelo.
 */
export const toUserRow = (user: User): UserSnapshot => user.toSnapshot();

/**
 * Data Mapper fila Sequelize → dominio.
 * @param row Instancia devuelta por Sequelize.
 * @returns Agregado rehidratado.
 */
export const toUser = (row: UserModel): User => User.restore(row.get({ plain: true }));
