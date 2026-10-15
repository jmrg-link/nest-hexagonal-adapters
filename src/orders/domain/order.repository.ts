import type { CrudRepository } from '../../shared/domain/crud.repository';
import type { Order } from './order';
import type { OrderCriteria } from './order.criteria';

/**
 * Puerto de salida para persistir pedidos. `update` persiste el estado mutable
 * (status y updatedAt): las líneas son inmutables por diseño del agregado.
 */
export type OrderRepository = CrudRepository<Order, OrderCriteria>;

/** Token de inyección del puerto. */
export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');
