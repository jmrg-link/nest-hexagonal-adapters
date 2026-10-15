import type {
  Order as OrderRecord,
  OrderItem as OrderItemRecord,
  Prisma,
} from '../../../../generated/prisma/client';
import { Order } from '../../../domain/order';
import type { OrderCriteria } from '../../../domain/order.criteria';

/** Registro de pedido con sus líneas cargadas. */
export type OrderWithItems = OrderRecord & { items: OrderItemRecord[] };

/** Carga las líneas en el orden en que se crearon. */
export const ORDER_INCLUDE = {
  items: { orderBy: { position: 'asc' } },
} as const satisfies Prisma.OrderInclude;

/**
 * Data Mapper dominio → alta anidada (pedido + líneas en una sola operación).
 * @param order Agregado de dominio.
 * @returns Datos para `order.create`.
 */
export const toOrderCreateInput = (order: Order): Prisma.OrderCreateInput => {
  const { items, ...fields } = order.toSnapshot();
  return {
    ...fields,
    items: { create: items.map((item, position) => ({ ...item, position })) },
  };
};

/**
 * Data Mapper registro → dominio.
 * @param record Pedido con sus líneas.
 * @returns Agregado rehidratado.
 */
export const toOrder = (record: OrderWithItems): Order =>
  Order.restore({
    ...record,
    items: record.items.map(({ sku, name, quantity, unitPriceCents }) => ({
      sku,
      name,
      quantity,
      unitPriceCents,
    })),
  });

/**
 * Traduce el criterio a un `where` de Prisma. Prisma ignora las claves con
 * `undefined`, así que el filtro opcional sale gratis.
 * @param criteria Criterio de dominio.
 * @returns Condición para `findMany` y `count`.
 */
export const toOrderWhere = (criteria: OrderCriteria): Prisma.OrderWhereInput => ({
  userId: criteria.userId,
  status: criteria.status,
  totalCents: { gte: criteria.minTotalCents, lte: criteria.maxTotalCents },
});
