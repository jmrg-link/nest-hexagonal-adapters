import { Injectable } from '@nestjs/common';
import { offsetOf, pageOf, type Page } from '../../../../shared/domain/page';
import { PrismaConnection } from '../../../../shared/infrastructure/database/prisma.connection';
import type { Order } from '../../../domain/order';
import type { OrderCriteria } from '../../../domain/order.criteria';
import type { OrderRepository } from '../../../domain/order.repository';
import { ORDER_INCLUDE, toOrder, toOrderCreateInput, toOrderWhere } from './order-record.mapper';

/**
 * Adaptador PostgreSQL (Prisma) del puerto OrderRepository. Las líneas viven en
 * `order_items` (relación 1:N); Prisma las carga con una consulta adicional por lote.
 */
@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly database: PrismaConnection) {}

  private get orders() {
    return this.database.client.order;
  }

  async create(order: Order): Promise<void> {
    await this.orders.create({ data: toOrderCreateInput(order) });
  }

  async update(order: Order): Promise<void> {
    await this.orders.update({
      where: { id: order.id },
      data: { status: order.status, updatedAt: order.updatedAt },
    });
  }

  async findById(id: string): Promise<Order | null> {
    const record = await this.orders.findUnique({ where: { id }, include: ORDER_INCLUDE });
    return record ? toOrder(record) : null;
  }

  async search(criteria: OrderCriteria): Promise<Page<Order>> {
    const where = toOrderWhere(criteria);
    const [records, total] = await this.database.client.$transaction([
      this.orders.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: criteria.sort },
        skip: offsetOf(criteria),
        take: criteria.limit,
      }),
      this.orders.count({ where }),
    ]);
    return pageOf(records.map(toOrder), total, criteria);
  }

  async delete(id: string): Promise<boolean> {
    const { count } = await this.orders.deleteMany({ where: { id } });
    return count === 1;
  }
}
