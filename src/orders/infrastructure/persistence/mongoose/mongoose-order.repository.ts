import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { Model } from 'mongoose';
import { offsetOf, pageOf, type Page } from '../../../../shared/domain/page';
import { MongooseConnection } from '../../../../shared/infrastructure/database/mongoose.connection';
import type { Order } from '../../../domain/order';
import type { OrderCriteria } from '../../../domain/order.criteria';
import type { OrderRepository } from '../../../domain/order.repository';
import { toOrder, toOrderDocument, toOrderFilter } from './order-document.mapper';
import { ORDER_MODEL, orderSchema, type OrderDocument } from './order.document';

/**
 * Adaptador MongoDB (Mongoose) del puerto OrderRepository. Un pedido es un único
 * documento con sus líneas: leerlo es una sola consulta, sin JOIN.
 */
@Injectable()
export class MongooseOrderRepository implements OrderRepository, OnModuleInit {
  private readonly orders: Model<OrderDocument>;

  constructor(database: MongooseConnection) {
    this.orders = database.model(ORDER_MODEL, orderSchema);
  }

  async onModuleInit(): Promise<void> {
    await this.orders.init();
  }

  async create(order: Order): Promise<void> {
    await this.orders.create(toOrderDocument(order));
  }

  async update(order: Order): Promise<void> {
    await this.orders
      .updateOne({ _id: order.id }, { $set: { status: order.status, updatedAt: order.updatedAt } })
      .exec();
  }

  async findById(id: string): Promise<Order | null> {
    const document = await this.orders.findById(id).lean<OrderDocument>().exec();
    return document ? toOrder(document) : null;
  }

  async search(criteria: OrderCriteria): Promise<Page<Order>> {
    const filter = toOrderFilter(criteria);
    const [documents, total] = await Promise.all([
      this.orders
        .find(filter)
        .sort({ createdAt: criteria.sort === 'asc' ? 1 : -1 })
        .skip(offsetOf(criteria))
        .limit(criteria.limit)
        .lean<OrderDocument[]>()
        .exec(),
      this.orders.countDocuments(filter).exec(),
    ]);
    return pageOf(documents.map(toOrder), total, criteria);
  }

  async delete(id: string): Promise<boolean> {
    const { deletedCount } = await this.orders.deleteOne({ _id: id }).exec();
    return deletedCount === 1;
  }
}
