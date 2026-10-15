import type { PageRequest } from '../../shared/domain/page';
import type { OrderStatus } from './order-status';

/**
 * Criterio de búsqueda de pedidos (patrón Criteria) alineado con la regla ESR:
 * igualdad (`userId`, `status`) → orden (`createdAt`) → rango (`totalCents`).
 * Cada adaptador lo traduce a su lenguaje: filtro Mongo o `where` de Prisma y Sequelize.
 */
export interface OrderCriteria extends PageRequest {
  readonly userId?: string;
  readonly status?: OrderStatus;
  readonly minTotalCents?: number;
  readonly maxTotalCents?: number;
}
