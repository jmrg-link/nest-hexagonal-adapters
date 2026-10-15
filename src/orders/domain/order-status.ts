/** Estados del ciclo de vida de un pedido. */
export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'cancelled'] as const;

/** Estado de un pedido. */
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Tabla de transiciones (patrón State simplificado): cada estado declara a qué
 * estados puede avanzar. Un estado nuevo es una entrada más, sin `if` repartidos (OCP).
 */
const TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: [],
  cancelled: [],
};

/**
 * Indica si la transición de estado está permitida.
 * @param from Estado actual.
 * @param to Estado destino.
 * @returns `true` si la máquina de estados la admite.
 */
export const canTransition = (from: OrderStatus, to: OrderStatus): boolean =>
  TRANSITIONS[from].includes(to);
