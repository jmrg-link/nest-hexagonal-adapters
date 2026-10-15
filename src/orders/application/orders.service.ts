import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccessDeniedError } from '../../shared/domain/domain-error';
import type { Page } from '../../shared/domain/page';
import { assertCanAccess, isAdmin, type Principal } from '../../shared/domain/principal';
import { Order } from '../domain/order';
import { OrderNotFoundError } from '../domain/order.errors';
import { ORDER_REPOSITORY, type OrderRepository } from '../domain/order.repository';
import type { CreateOrderDto, ListOrdersQuery, UpdateOrderStatusDto } from './order.schemas';

/**
 * Casos de uso de pedidos. Las reglas de negocio (total, estados) viven en el
 * agregado; aquí solo se orquesta y se aplica la política de acceso.
 */
@Injectable()
export class OrdersService {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository) {}

  /**
   * Registra un pedido a nombre de la identidad autenticada.
   * @param dto Líneas validadas.
   * @param principal Identidad autenticada.
   * @returns Pedido creado en estado `pending`.
   */
  async place(dto: CreateOrderDto, principal: Principal): Promise<Order> {
    const order = Order.create({ id: randomUUID(), userId: principal.userId, items: dto.items });
    await this.orders.create(order);
    return order;
  }

  /**
   * Lista pedidos. Un cliente solo ve los suyos; el administrador puede filtrar por usuario.
   * @param query Filtros ESR y paginación.
   * @param principal Identidad autenticada.
   * @returns Página de pedidos.
   */
  list(query: ListOrdersQuery, principal: Principal): Promise<Page<Order>> {
    const userId = isAdmin(principal) ? query.userId : principal.userId;
    return this.orders.search({ ...query, userId });
  }

  /**
   * Devuelve un pedido del propietario o de cualquiera si es administrador.
   * @param id Pedido solicitado.
   * @param principal Identidad autenticada.
   * @returns Pedido.
   */
  async findById(id: string, principal: Principal): Promise<Order> {
    const order = await this.orders.findById(id);
    if (!order) {
      throw new OrderNotFoundError(id);
    }
    assertCanAccess(principal, order.userId);
    return order;
  }

  /**
   * Cambia el estado. El cliente solo puede cancelar los suyos; el resto, administración.
   * @param id Pedido.
   * @param dto Estado destino.
   * @param principal Identidad autenticada.
   * @returns Pedido actualizado.
   */
  async changeStatus(id: string, dto: UpdateOrderStatusDto, principal: Principal): Promise<Order> {
    const order = await this.findById(id, principal);
    if (!isAdmin(principal) && dto.status !== 'cancelled') {
      throw new AccessDeniedError();
    }
    order.changeStatus(dto.status);
    await this.orders.update(order);
    return order;
  }

  /**
   * Elimina un pedido (solo administración).
   * @param id Pedido.
   * @throws {OrderNotFoundError} Si no existe.
   */
  async remove(id: string): Promise<void> {
    if (!(await this.orders.delete(id))) {
      throw new OrderNotFoundError(id);
    }
  }
}
