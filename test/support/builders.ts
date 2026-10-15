import { randomUUID } from 'node:crypto';
import { Order, type NewOrder } from '../../src/orders/domain/order';
import type { OrderItemProps } from '../../src/orders/domain/order-item';
import { User, type NewUser } from '../../src/users/domain/user';

let sequence = 0;

export const at = (minute: number): Date => new Date(Date.UTC(2026, 0, 1, 10, minute));

export const anItem = (unitPriceCents = 1000, quantity = 1): OrderItemProps => ({
  sku: `SKU-${unitPriceCents}`,
  name: 'Producto',
  quantity,
  unitPriceCents,
});

export const aUser = (overrides: Partial<NewUser> = {}, createdAt: Date = at(0)): User => {
  sequence += 1;
  return User.create(
    {
      id: randomUUID(),
      email: `user${sequence}@mail.com`,
      name: `Usuario ${sequence}`,
      passwordHash: 'scrypt$1024$8$1$salt$key',
      role: 'customer',
      ...overrides,
    },
    createdAt,
  );
};

export const anOrder = (overrides: Partial<NewOrder> = {}, createdAt: Date = at(0)): Order =>
  Order.create(
    { id: randomUUID(), userId: randomUUID(), items: [anItem()], ...overrides },
    createdAt,
  );
