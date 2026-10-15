import type { User as UserRecord } from '../../../../generated/prisma/client';
import { User, type UserSnapshot } from '../../../domain/user';

/**
 * Data Mapper dominio → registro Prisma. Los campos coinciden con el snapshot
 * porque `@map` traduce los nombres a snake_case en la base de datos.
 * @param user Agregado de dominio.
 * @returns Datos para `create`/`update`.
 */
export const toUserRecord = (user: User): UserSnapshot => user.toSnapshot();

/**
 * Data Mapper registro Prisma → dominio.
 * @param record Fila devuelta por Prisma.
 * @returns Agregado rehidratado.
 */
export const toUser = (record: UserRecord): User => User.restore(record);
