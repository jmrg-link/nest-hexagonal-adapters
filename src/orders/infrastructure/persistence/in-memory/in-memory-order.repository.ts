import { Injectable } from '@nestjs/common';
import { InMemoryRepository } from '../../../../shared/infrastructure/in-memory/in-memory.repository';
import { Order, type OrderSnapshot } from '../../../domain/order';
import type { OrderCriteria } from '../../../domain/order.criteria';
import type { OrderRepository } from '../../../domain/order.repository';

/** Adaptador en memoria del puerto OrderRepository; evalúa el criterio ESR en JS. */
@Injectable()
export class InMemoryOrderRepository
  extends InMemoryRepository<Order, OrderSnapshot, OrderCriteria>
  implements OrderRepository
{
  protected override toSnapshot(order: Order): OrderSnapshot {
    return order.toSnapshot();
  }

  protected override toEntity(snapshot: OrderSnapshot): Order {
    return Order.restore(snapshot);
  }

  protected override matches(row: OrderSnapshot, criteria: OrderCriteria): boolean {
    const { userId, status, minTotalCents, maxTotalCents } = criteria;
    return (
      (userId === undefined || row.userId === userId) &&
      (status === undefined || row.status === status) &&
      (minTotalCents === undefined || row.totalCents >= minTotalCents) &&
      (maxTotalCents === undefined || row.totalCents <= maxTotalCents)
    );
  }
}
