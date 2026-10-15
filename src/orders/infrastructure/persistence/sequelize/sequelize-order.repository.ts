import { Injectable } from '@nestjs/common';
import type { OrderItem, Sequelize } from 'sequelize';
import { offsetOf, pageOf, type Page } from '../../../../shared/domain/page';
import { SequelizeConnection } from '../../../../shared/infrastructure/database/sequelize.connection';
import type { Order } from '../../../domain/order';
import type { OrderCriteria } from '../../../domain/order.criteria';
import type { OrderRepository } from '../../../domain/order.repository';
import { toOrder, toOrderRows, toOrderWhere } from './order-model.mapper';
import { initializeOrderModels, OrderItemModel, OrderModel } from './order.model';

const ITEMS = { model: OrderItemModel, as: 'items' };
const ITEMS_ORDER: OrderItem = [ITEMS, 'position', 'ASC'];

/**
 * Adaptador PostgreSQL (Sequelize) del puerto OrderRepository. La cabecera y las
 * líneas se insertan en una transacción explícita: todo o nada.
 */
@Injectable()
export class SequelizeOrderRepository implements OrderRepository {
  private readonly sequelize: Sequelize;

  constructor(database: SequelizeConnection) {
    this.sequelize = database.sequelize;
    initializeOrderModels(this.sequelize);
  }

  async create(order: Order): Promise<void> {
    const rows = toOrderRows(order);
    await this.sequelize.transaction(async (transaction) => {
      await OrderModel.create(rows.order, { transaction });
      await OrderItemModel.bulkCreate(rows.items, { transaction });
    });
  }

  async update(order: Order): Promise<void> {
    await OrderModel.update(
      { status: order.status, updatedAt: order.updatedAt },
      { where: { id: order.id } },
    );
  }

  async findById(id: string): Promise<Order | null> {
    const row = await OrderModel.findByPk(id, { include: [ITEMS], order: [ITEMS_ORDER] });
    return row ? toOrder(row) : null;
  }

  async search(criteria: OrderCriteria): Promise<Page<Order>> {
    const { rows, count } = await OrderModel.findAndCountAll({
      where: toOrderWhere(criteria),
      include: [ITEMS],
      order: [['createdAt', criteria.sort.toUpperCase()], ITEMS_ORDER],
      offset: offsetOf(criteria),
      limit: criteria.limit,
      distinct: true,
    });
    return pageOf(rows.map(toOrder), count, criteria);
  }

  async delete(id: string): Promise<boolean> {
    return (await OrderModel.destroy({ where: { id } })) === 1;
  }
}
