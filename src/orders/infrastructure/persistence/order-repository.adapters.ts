import type { AdapterRegistry } from '../../../shared/infrastructure/database/database.providers';
import type { OrderRepository } from '../../domain/order.repository';
import { InMemoryOrderRepository } from './in-memory/in-memory-order.repository';
import { MongooseOrderRepository } from './mongoose/mongoose-order.repository';
import { PrismaOrderRepository } from './prisma/prisma-order.repository';
import { SequelizeOrderRepository } from './sequelize/sequelize-order.repository';

/** Adaptadores disponibles del puerto OrderRepository, uno por driver. */
export const ORDER_REPOSITORY_ADAPTERS: AdapterRegistry<OrderRepository> = {
  memory: InMemoryOrderRepository,
  mongoose: MongooseOrderRepository,
  prisma: PrismaOrderRepository,
  sequelize: SequelizeOrderRepository,
};
