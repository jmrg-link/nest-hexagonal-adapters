import type { QueryFilter } from 'mongoose';
import { Order } from '../../../domain/order';
import type { OrderCriteria } from '../../../domain/order.criteria';
import type { OrderDocument } from './order.document';

/**
 * Data Mapper dominio → documento con las líneas embebidas.
 * @param order Agregado de dominio.
 * @returns Documento Mongo.
 */
export const toOrderDocument = (order: Order): OrderDocument => {
  const { id, items, ...fields } = order.toSnapshot();
  return { _id: id, ...fields, items: items.map((item) => ({ ...item })) };
};

/**
 * Data Mapper documento → dominio.
 * @param document Documento leído con `lean()`.
 * @returns Agregado rehidratado.
 */
export const toOrder = (document: OrderDocument): Order =>
  Order.restore({
    id: document._id,
    userId: document.userId,
    status: document.status,
    totalCents: document.totalCents,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    items: document.items.map(({ sku, name, quantity, unitPriceCents }) => ({
      sku,
      name,
      quantity,
      unitPriceCents,
    })),
  });

/**
 * Traduce el criterio a un filtro Mongo en orden ESR. Solo incluye las claves con
 * valor: `undefined` se serializaría como `null` y no encontraría nada.
 * @param criteria Criterio de dominio.
 * @returns Filtro para `find` y `countDocuments`.
 */
export const toOrderFilter = (criteria: OrderCriteria): QueryFilter<OrderDocument> => {
  const filter: Record<string, unknown> = {};
  if (criteria.userId) {
    filter.userId = criteria.userId;
  }
  if (criteria.status) {
    filter.status = criteria.status;
  }
  const range: Record<string, number> = {};
  if (criteria.minTotalCents !== undefined) {
    range.$gte = criteria.minTotalCents;
  }
  if (criteria.maxTotalCents !== undefined) {
    range.$lte = criteria.maxTotalCents;
  }
  if (Object.keys(range).length > 0) {
    filter.totalCents = range;
  }
  return filter as QueryFilter<OrderDocument>;
};
