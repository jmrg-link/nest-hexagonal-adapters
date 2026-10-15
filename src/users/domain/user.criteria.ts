import type { PageRequest } from '../../shared/domain/page';
import type { Role } from '../../shared/domain/principal';

/**
 * Criterio de búsqueda de usuarios (patrón Criteria) alineado con la regla ESR:
 * igualdad por `role` y orden por `createdAt`.
 */
export interface UserCriteria extends PageRequest {
  readonly role?: Role;
}
