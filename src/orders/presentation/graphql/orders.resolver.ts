import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentPrincipal, Roles } from '../../../auth/presentation/auth.decorators';
import { idSchema } from '../../../shared/application/pagination.schemas';
import { mapPage, type Page } from '../../../shared/domain/page';
import type { Principal } from '../../../shared/domain/principal';
import { ArgsSchemaPipe } from '../../../shared/presentation/validation';
import {
  createOrderSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
  type CreateOrderDto,
  type ListOrdersQuery,
  type OrderView,
  type UpdateOrderStatusDto,
} from '../../application/order.schemas';
import { OrdersService } from '../../application/orders.service';
import { toOrderView } from '../order.presenter';
import {
  CreateOrderInput,
  OrderFilterInput,
  OrderPageType,
  OrderType,
  UpdateOrderStatusInput,
} from './order.types';

/** Adaptador de entrada GraphQL para pedidos; espejo del controlador REST. */
@Resolver(() => OrderType)
export class OrdersResolver {
  constructor(private readonly orders: OrdersService) {}

  @Mutation(() => OrderType, { description: 'Crea un pedido para la identidad autenticada' })
  async createOrder(
    @Args('input', { type: () => CreateOrderInput }, new ArgsSchemaPipe(createOrderSchema))
    input: CreateOrderDto,
    @CurrentPrincipal() principal: Principal,
  ): Promise<OrderView> {
    return toOrderView(await this.orders.place(input, principal));
  }

  @Query(() => OrderPageType, { name: 'orders', description: 'Listado con filtros ESR' })
  async list(
    @Args(
      'filter',
      { type: () => OrderFilterInput, nullable: true, defaultValue: {} },
      new ArgsSchemaPipe(listOrdersQuerySchema),
    )
    filter: ListOrdersQuery,
    @CurrentPrincipal() principal: Principal,
  ): Promise<Page<OrderView>> {
    return mapPage(await this.orders.list(filter, principal), toOrderView);
  }

  @Query(() => OrderType, { name: 'order', description: 'Pedido propio o cualquiera (admin)' })
  async findOne(
    @Args('id', { type: () => ID }, new ArgsSchemaPipe(idSchema)) id: string,
    @CurrentPrincipal() principal: Principal,
  ): Promise<OrderView> {
    return toOrderView(await this.orders.findById(id, principal));
  }

  @Mutation(() => OrderType, { description: 'Cambia el estado; el cliente solo puede cancelar' })
  async updateOrderStatus(
    @Args('id', { type: () => ID }, new ArgsSchemaPipe(idSchema)) id: string,
    @Args(
      'input',
      { type: () => UpdateOrderStatusInput },
      new ArgsSchemaPipe(updateOrderStatusSchema),
    )
    input: UpdateOrderStatusDto,
    @CurrentPrincipal() principal: Principal,
  ): Promise<OrderView> {
    return toOrderView(await this.orders.changeStatus(id, input, principal));
  }

  @Mutation(() => Boolean, { description: 'Elimina un pedido (admin)' })
  @Roles('admin')
  async deleteOrder(
    @Args('id', { type: () => ID }, new ArgsSchemaPipe(idSchema)) id: string,
  ): Promise<boolean> {
    await this.orders.remove(id);
    return true;
  }
}
