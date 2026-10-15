import { OrderItem, type OrderItemProps } from './order-item';
import { InvalidOrderError, InvalidOrderTransitionError } from './order.errors';
import { canTransition, type OrderStatus } from './order-status';

/** Importe máximo de un pedido: invariante del agregado (1.000.000 €). */
export const MAX_ORDER_TOTAL_CENTS = 100_000_000;

/** Estado serializable. `totalCents` es derivado y se persiste para filtrar por rango. */
export interface OrderSnapshot {
  readonly id: string;
  readonly userId: string;
  readonly status: OrderStatus;
  readonly items: readonly OrderItemProps[];
  readonly totalCents: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Datos necesarios para registrar un pedido. */
export interface NewOrder {
  readonly id: string;
  readonly userId: string;
  readonly items: readonly OrderItemProps[];
}

interface OrderState extends Omit<OrderSnapshot, 'items' | 'totalCents'> {
  readonly items: readonly OrderItem[];
}

const totalOf = (items: readonly OrderItem[]): number =>
  items.reduce((total, item) => total + item.subtotalCents, 0);

/**
 * Agregado Order: raíz que contiene sus líneas. Calcula el total a partir de ellas
 * y controla el ciclo de vida con una máquina de estados, así ninguna capa externa
 * puede dejarlo incoherente. Las líneas son inmutables una vez creado.
 */
export class Order {
  private constructor(private state: OrderState) {}

  /**
   * Registra un pedido nuevo en estado `pending`.
   * @param data Identificador, propietario y líneas.
   * @param now Instante de creación (inyectable para tests).
   * @returns Pedido nuevo.
   * @throws {InvalidOrderError} Sin líneas o por encima del importe máximo.
   */
  static create(data: NewOrder, now: Date = new Date()): Order {
    if (data.items.length === 0) {
      throw new InvalidOrderError('Un pedido necesita al menos una línea');
    }
    const items = data.items.map((item) => OrderItem.create(item));
    if (totalOf(items) > MAX_ORDER_TOTAL_CENTS) {
      throw new InvalidOrderError(`El total no puede superar ${MAX_ORDER_TOTAL_CENTS} céntimos`);
    }
    return new Order({
      id: data.id,
      userId: data.userId,
      status: 'pending',
      items,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Rehidrata un pedido desde persistencia. El total se recalcula desde las líneas.
   * @param snapshot Estado guardado.
   * @returns Pedido rehidratado.
   */
  static restore(snapshot: OrderSnapshot): Order {
    return new Order({
      id: snapshot.id,
      userId: snapshot.userId,
      status: snapshot.status,
      items: snapshot.items.map((item) => OrderItem.create(item)),
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    });
  }

  get id(): string {
    return this.state.id;
  }

  get userId(): string {
    return this.state.userId;
  }

  get status(): OrderStatus {
    return this.state.status;
  }

  get items(): readonly OrderItem[] {
    return this.state.items;
  }

  get totalCents(): number {
    return totalOf(this.state.items);
  }

  get createdAt(): Date {
    return this.state.createdAt;
  }

  get updatedAt(): Date {
    return this.state.updatedAt;
  }

  /**
   * Avanza el ciclo de vida respetando la máquina de estados.
   * @param next Estado destino.
   * @param now Instante del cambio.
   * @throws {InvalidOrderTransitionError} Si la transición no está permitida.
   */
  changeStatus(next: OrderStatus, now: Date = new Date()): void {
    if (!canTransition(this.state.status, next)) {
      throw new InvalidOrderTransitionError(this.state.status, next);
    }
    this.state = { ...this.state, status: next, updatedAt: now };
  }

  /**
   * Copia inmutable del estado para persistir.
   * @returns Snapshot del pedido con el total calculado.
   */
  toSnapshot(): OrderSnapshot {
    return {
      id: this.state.id,
      userId: this.state.userId,
      status: this.state.status,
      items: this.state.items.map((item) => item.toProps()),
      totalCents: this.totalCents,
      createdAt: this.state.createdAt,
      updatedAt: this.state.updatedAt,
    };
  }
}
