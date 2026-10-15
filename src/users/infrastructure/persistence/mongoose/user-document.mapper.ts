import { User } from '../../../domain/user';
import type { UserDocument } from './user.document';

/**
 * Data Mapper dominio → documento. `id` pasa a `_id`; el resto se copia tal cual.
 * @param user Agregado de dominio.
 * @returns Documento Mongo.
 */
export const toUserDocument = (user: User): UserDocument => {
  const { id, ...fields } = user.toSnapshot();
  return { _id: id, ...fields };
};

/**
 * Data Mapper documento → dominio. Copia campo a campo para no filtrar
 * propiedades inesperadas del documento al agregado.
 * @param document Documento leído con `lean()`.
 * @returns Agregado rehidratado.
 */
export const toUser = (document: UserDocument): User =>
  User.restore({
    id: document._id,
    email: document.email,
    name: document.name,
    passwordHash: document.passwordHash,
    role: document.role,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  });
