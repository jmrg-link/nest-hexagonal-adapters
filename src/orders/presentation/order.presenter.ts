import type { OrderView } from '../application/order.schemas';
import type { Order } from '../domain/order';

/**
 * Proyección pública del pedido, compartida por REST y GraphQL.
 * @param order Agregado de dominio.
 * @returns Vista serializable con subtotales y total.
 */
export const toOrderView = (order: Order): OrderView => ({
  id: order.id,
  userId: order.userId,
  status: order.status,
  items: order.items.map((item) => ({
    sku: item.sku,
    name: item.name,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    subtotalCents: item.subtotalCents,
  })),
  totalCents: order.totalCents,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});
