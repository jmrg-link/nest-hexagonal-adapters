import { Field, GraphQLISODateTime, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  graphqlEnum,
  PageInput,
  Paginated,
} from '../../../shared/presentation/graphql/common.types';
import { ORDER_STATUSES, type OrderStatus } from '../../domain/order-status';

/** Enum GraphQL generado desde `ORDER_STATUSES` del dominio. */
export const OrderStatusEnum = graphqlEnum(ORDER_STATUSES, 'OrderStatus');

/** Línea de pedido en GraphQL. */
@ObjectType('OrderItem')
export class OrderItemType {
  @Field()
  sku!: string;

  @Field()
  name!: string;

  @Field(() => Int)
  quantity!: number;

  @Field(() => Int)
  unitPriceCents!: number;

  @Field(() => Int)
  subtotalCents!: number;
}

/** Pedido en GraphQL; espejo de `orderViewSchema`. */
@ObjectType('Order')
export class OrderType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => OrderStatusEnum)
  status!: OrderStatus;

  @Field(() => [OrderItemType])
  items!: OrderItemType[];

  @Field(() => Int)
  totalCents!: number;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

/** Página de pedidos. */
@ObjectType('OrderPage')
export class OrderPageType extends Paginated(OrderType) {}

/** Línea de entrada; las reglas las valida `orderItemSchema`. */
@InputType()
export class OrderItemInput {
  @Field()
  sku!: string;

  @Field()
  name!: string;

  @Field(() => Int)
  quantity!: number;

  @Field(() => Int)
  unitPriceCents!: number;
}

/** Alta de pedido; las reglas las valida `createOrderSchema`. */
@InputType()
export class CreateOrderInput {
  @Field(() => [OrderItemInput])
  items!: OrderItemInput[];
}

/** Cambio de estado; lo valida `updateOrderStatusSchema` y la máquina de estados. */
@InputType()
export class UpdateOrderStatusInput {
  @Field(() => OrderStatusEnum)
  status!: OrderStatus;
}

/** Filtros ESR del listado; los valida `listOrdersQuerySchema`. */
@InputType()
export class OrderFilterInput extends PageInput {
  @Field(() => ID, { nullable: true })
  userId?: string;

  @Field(() => OrderStatusEnum, { nullable: true })
  status?: OrderStatus;

  @Field(() => Int, { nullable: true })
  minTotalCents?: number;

  @Field(() => Int, { nullable: true })
  maxTotalCents?: number;
}
