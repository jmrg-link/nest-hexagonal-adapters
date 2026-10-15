import { Module } from '@nestjs/common';
import { OrdersService } from './application/orders.service';
import { OrdersController } from './presentation/http/orders.controller';
import { OrdersResolver } from './presentation/graphql/orders.resolver';

/** Módulo de pedidos. Recibe ORDER_REPOSITORY del composition root (PersistenceModule). */
@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrdersResolver],
})
export class OrdersModule {}
