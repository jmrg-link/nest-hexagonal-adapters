import { Schema } from 'mongoose';
import { ORDER_STATUSES, type OrderStatus } from '../../../domain/order-status';

/** Línea embebida dentro del documento de pedido. */
export interface OrderItemDocument {
  sku: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

/** Forma del documento en la colección `orders`. */
export interface OrderDocument {
  _id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItemDocument[];
  totalCents: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Nombre del modelo registrado en la conexión. */
export const ORDER_MODEL = 'Order';

const orderItemSchema = new Schema<OrderItemDocument>(
  {
    sku: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceCents: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

/**
 * Esquema de `orders` con las líneas EMBEBIDAS: lo que se lee junto se guarda junto
 * (en SQL serían la tabla `order_items` y un JOIN). Índices compuestos según ESR:
 * - `{ userId, status, createdAt: -1, totalCents }`: E = userId + status, S = createdAt, R = total.
 * - `{ userId, createdAt: -1, totalCents }`: el mismo acceso cuando no se filtra por status.
 */
export const orderSchema = new Schema<OrderDocument>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    status: { type: String, enum: ORDER_STATUSES, required: true },
    items: { type: [orderItemSchema], required: true },
    totalCents: { type: Number, required: true, min: 0 },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'orders', versionKey: false },
);

orderSchema.index({ userId: 1, status: 1, createdAt: -1, totalCents: 1 });
orderSchema.index({ userId: 1, createdAt: -1, totalCents: 1 });
