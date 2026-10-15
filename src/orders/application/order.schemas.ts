import { z } from 'zod';
import { pageRequestShape, pageViewSchema } from '../../shared/application/pagination.schemas';
import { ORDER_STATUSES } from '../domain/order-status';

/** Línea de pedido de entrada. Importes en céntimos enteros. */
export const orderItemSchema = z
  .object({
    sku: z.string().trim().min(1).max(64).describe('Referencia del producto'),
    name: z.string().trim().min(1).max(120).describe('Nombre del producto'),
    quantity: z.number().int().min(1).max(1000).describe('Unidades'),
    unitPriceCents: z
      .number()
      .int()
      .min(0)
      .max(100_000_000)
      .describe('Precio unitario en céntimos'),
  })
  .meta({ id: 'OrderItemRequest' });

/** Alta de pedido para la identidad autenticada. */
export const createOrderSchema = z
  .object({ items: z.array(orderItemSchema).min(1).max(50) })
  .meta({ id: 'CreateOrderRequest' });

/** Cambio de estado del pedido. */
export const updateOrderStatusSchema = z
  .object({ status: z.enum(ORDER_STATUSES) })
  .meta({ id: 'UpdateOrderStatusRequest' });

/** Filtros ESR del listado: igualdad (userId, status) + orden (createdAt) + rango (total). */
export const listOrdersQuerySchema = z
  .object({
    userId: z.uuid().optional().describe('Solo administración: pedidos de un usuario'),
    status: z.enum(ORDER_STATUSES).optional(),
    minTotalCents: z.coerce.number().int().min(0).optional().describe('Total mínimo (céntimos)'),
    maxTotalCents: z.coerce.number().int().min(0).optional().describe('Total máximo (céntimos)'),
    ...pageRequestShape,
  })
  .refine(
    ({ minTotalCents, maxTotalCents }) =>
      minTotalCents === undefined || maxTotalCents === undefined || minTotalCents <= maxTotalCents,
    { message: 'minTotalCents no puede superar maxTotalCents', path: ['minTotalCents'] },
  );

/** Línea de pedido de salida con su subtotal. */
export const orderItemViewSchema = z
  .object({
    sku: z.string(),
    name: z.string(),
    quantity: z.number().int(),
    unitPriceCents: z.number().int(),
    subtotalCents: z.number().int(),
  })
  .meta({ id: 'OrderItem' });

/** Vista pública de un pedido. */
export const orderViewSchema = z
  .object({
    id: z.uuid(),
    userId: z.uuid(),
    status: z.enum(ORDER_STATUSES),
    items: z.array(orderItemViewSchema),
    totalCents: z.number().int(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .meta({ id: 'Order' });

/** Página de pedidos. */
export const orderPageViewSchema = pageViewSchema(orderViewSchema).meta({ id: 'OrderPage' });

export type CreateOrderDto = z.output<typeof createOrderSchema>;
export type UpdateOrderStatusDto = z.output<typeof updateOrderStatusSchema>;
export type ListOrdersQuery = z.output<typeof listOrdersQuerySchema>;
export type OrderView = z.output<typeof orderViewSchema>;
