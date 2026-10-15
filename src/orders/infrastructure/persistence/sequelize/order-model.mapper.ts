import { Op, type WhereOptions } from 'sequelize';
import { Order } from '../../../domain/order';
import type { OrderCriteria } from '../../../domain/order.criteria';
import type { OrderAttributes, OrderItemAttributes, OrderModel } from './order.model';

/** Filas a insertar para un pedido: la cabecera y sus líneas con posición. */
export interface OrderRows {
  readonly order: OrderAttributes;
  readonly items: OrderItemAttributes[];
}

/**
 * Data Mapper dominio → filas relacionales (cabecera + líneas).
 * @param order Agregado de dominio.
 * @returns Filas para `orders` y `order_items`.
 */
export const toOrderRows = (order: Order): OrderRows => {
  const { items, ...fields } = order.toSnapshot();
  return {
    order: fields,
    items: items.map((item, position) => ({ ...item, orderId: order.id, position })),
  };
};

/**
 * Data Mapper fila (con `items` incluidos) → dominio.
 * @param row Instancia de OrderModel con la asociación cargada.
 * @returns Agregado rehidratado.
 */
export const toOrder = (row: OrderModel): Order =>
  Order.restore({
    id: row.id,
    userId: row.userId,
    status: row.status,
    totalCents: row.totalCents,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: (row.items ?? []).map(({ sku, name, quantity, unitPriceCents }) => ({
      sku,
      name,
      quantity,
      unitPriceCents,
    })),
  });

/**
 * Traduce el criterio a un `where` de Sequelize. Sequelize rechaza claves con
 * `undefined`, así que solo se añaden las presentes.
 * @param criteria Criterio de dominio.
 * @returns Condición para `findAndCountAll`.
 */
export const toOrderWhere = (criteria: OrderCriteria): WhereOptions<OrderAttributes> => {
  const range = {
    ...(criteria.minTotalCents !== undefined ? { [Op.gte]: criteria.minTotalCents } : {}),
    ...(criteria.maxTotalCents !== undefined ? { [Op.lte]: criteria.maxTotalCents } : {}),
  };
  return {
    ...(criteria.userId ? { userId: criteria.userId } : {}),
    ...(criteria.status ? { status: criteria.status } : {}),
    ...(Object.getOwnPropertySymbols(range).length > 0 ? { totalCents: range } : {}),
  };
};
