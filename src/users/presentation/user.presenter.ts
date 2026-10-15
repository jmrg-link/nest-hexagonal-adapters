import type { UserView } from '../application/user.schemas';
import type { User } from '../domain/user';

/**
 * Proyección pública del usuario, compartida por REST y GraphQL.
 * Lista blanca de campos: el hash de la contraseña nunca sale de la aplicación.
 * @param user Agregado de dominio.
 * @returns Vista serializable.
 */
export const toUserView = (user: User): UserView => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
