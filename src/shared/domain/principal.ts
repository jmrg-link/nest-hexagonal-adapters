import { AccessDeniedError } from './domain-error';

/** Roles soportados por la plataforma. */
export const ROLES = ['admin', 'customer'] as const;

/** Rol de una identidad. */
export type Role = (typeof ROLES)[number];

/** Identidad autenticada que viaja en el JWT y en el contexto de cada petición. */
export interface Principal {
  readonly userId: string;
  readonly email: string;
  readonly role: Role;
}

/**
 * Indica si la identidad tiene rol de administración.
 * @param principal Identidad autenticada.
 * @returns `true` si es administrador.
 */
export const isAdmin = (principal: Principal): boolean => principal.role === 'admin';

/**
 * Política de acceso a recursos propios: pasa el administrador o el propietario.
 * @param principal Identidad autenticada.
 * @param ownerId Propietario del recurso.
 * @throws {AccessDeniedError} Si no es ni administrador ni propietario.
 */
export const assertCanAccess = (principal: Principal, ownerId: string): void => {
  if (!isAdmin(principal) && principal.userId !== ownerId) {
    throw new AccessDeniedError();
  }
};
