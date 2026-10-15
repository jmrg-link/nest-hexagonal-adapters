import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentPrincipal, Roles } from '../../../auth/presentation/auth.decorators';
import { idSchema } from '../../../shared/application/pagination.schemas';
import { mapPage, type Page } from '../../../shared/domain/page';
import type { Principal } from '../../../shared/domain/principal';
import {
  createOrderSchema,
  listOrdersQuerySchema,
  orderPageViewSchema,
  orderViewSchema,
  updateOrderStatusSchema,
  type CreateOrderDto,
  type ListOrdersQuery,
  type OrderView,
  type UpdateOrderStatusDto,
} from '../../application/order.schemas';
import { OrdersService } from '../../application/orders.service';
import { toOrderView } from '../order.presenter';

/** Adaptador de entrada REST para pedidos. */
@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'Pedido creado en estado pending',
    standardSchema: orderViewSchema,
  })
  async place(
    @Body({ schema: createOrderSchema }) dto: CreateOrderDto,
    @CurrentPrincipal() principal: Principal,
  ): Promise<OrderView> {
    return toOrderView(await this.orders.place(dto, principal));
  }

  @Get()
  @ApiOkResponse({
    description: 'Página de pedidos (filtros ESR)',
    standardSchema: orderPageViewSchema,
  })
  async list(
    @Query({ schema: listOrdersQuerySchema }) query: ListOrdersQuery,
    @CurrentPrincipal() principal: Principal,
  ): Promise<Page<OrderView>> {
    return mapPage(await this.orders.list(query, principal), toOrderView);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Pedido', standardSchema: orderViewSchema })
  async findOne(
    @Param('id', { schema: idSchema }) id: string,
    @CurrentPrincipal() principal: Principal,
  ): Promise<OrderView> {
    return toOrderView(await this.orders.findById(id, principal));
  }

  @Patch(':id/status')
  @ApiOkResponse({ description: 'Estado actualizado', standardSchema: orderViewSchema })
  async changeStatus(
    @Param('id', { schema: idSchema }) id: string,
    @Body({ schema: updateOrderStatusSchema }) dto: UpdateOrderStatusDto,
    @CurrentPrincipal() principal: Principal,
  ): Promise<OrderView> {
    return toOrderView(await this.orders.changeStatus(id, dto, principal));
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Pedido eliminado' })
  async remove(@Param('id', { schema: idSchema }) id: string): Promise<void> {
    await this.orders.remove(id);
  }
}
