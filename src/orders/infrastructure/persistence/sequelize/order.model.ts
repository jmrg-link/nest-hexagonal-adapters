import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  type NonAttribute,
  type Sequelize,
} from 'sequelize';
import { ORDER_STATUSES, type OrderStatus } from '../../../domain/order-status';

const ORDER_MODEL = 'Order';
const ORDER_ITEM_MODEL = 'OrderItem';

/** Fila de `order_items` (PK compuesta: order_id + position). */
export class OrderItemModel extends Model<
  InferAttributes<OrderItemModel>,
  InferCreationAttributes<OrderItemModel>
> {
  declare orderId: string;
  declare position: number;
  declare sku: string;
  declare name: string;
  declare quantity: number;
  declare unitPriceCents: number;
}

/** Fila de `orders` con la asociación 1:N `items`. */
export class OrderModel extends Model<
  InferAttributes<OrderModel, { omit: 'items' }>,
  InferCreationAttributes<OrderModel, { omit: 'items' }>
> {
  declare id: string;
  declare userId: string;
  declare status: OrderStatus;
  declare totalCents: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare items?: NonAttribute<OrderItemModel[]>;
}

/** Atributos persistibles de un pedido. */
export type OrderAttributes = InferAttributes<OrderModel, { omit: 'items' }>;

/** Atributos persistibles de una línea. */
export type OrderItemAttributes = InferAttributes<OrderItemModel>;

/**
 * Inicializa ambos modelos y su asociación sobre las tablas de la migración
 * (idempotente por instancia de Sequelize).
 * @param sequelize Instancia conectada.
 */
export const initializeOrderModels = (sequelize: Sequelize): void => {
  if (sequelize.isDefined(ORDER_MODEL)) {
    return;
  }
  const common = { sequelize, underscored: true, timestamps: false } as const;
  OrderModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      status: { type: DataTypes.ENUM(...ORDER_STATUSES), allowNull: false },
      totalCents: { type: DataTypes.INTEGER, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    { ...common, modelName: ORDER_MODEL, tableName: 'orders' },
  );
  OrderItemModel.init(
    {
      orderId: { type: DataTypes.UUID, primaryKey: true },
      position: { type: DataTypes.INTEGER, primaryKey: true },
      sku: { type: DataTypes.TEXT, allowNull: false },
      name: { type: DataTypes.TEXT, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      unitPriceCents: { type: DataTypes.INTEGER, allowNull: false },
    },
    { ...common, modelName: ORDER_ITEM_MODEL, tableName: 'order_items' },
  );
  OrderModel.hasMany(OrderItemModel, { as: 'items', foreignKey: 'orderId', onDelete: 'CASCADE' });
};
