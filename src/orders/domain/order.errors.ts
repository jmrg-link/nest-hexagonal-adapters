import { BusinessRuleError, NotFoundError } from '../../shared/domain/domain-error';
import type { OrderStatus } from './order-status';

/** El pedido no existe. */
export class OrderNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Pedido ${id} no encontrado`);
  }
}

/** Se ha violado una invariante del pedido o de sus líneas. */
export class InvalidOrderError extends BusinessRuleError {
  constructor(reason: string) {
    super(reason);
  }
}

/** La máquina de estados no permite la transición pedida. */
export class InvalidOrderTransitionError extends BusinessRuleError {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Un pedido no puede pasar de ${from} a ${to}`);
  }
}
