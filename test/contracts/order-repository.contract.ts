import { randomUUID } from 'node:crypto';
import type { Order } from '../../src/orders/domain/order';
import type { OrderCriteria } from '../../src/orders/domain/order.criteria';
import type { DatabaseDriver } from '../../src/shared/infrastructure/database/database-driver';
import { anItem, anOrder, at } from '../support/builders';
import { createRepositoryHarness, type RepositoryHarness } from './repository-harness';

const ids = (orders: readonly Order[]): string[] => orders.map((order) => order.id);

export const describeOrderRepositoryContract = (driver: DatabaseDriver): void => {
  describe(`OrderRepository · ${driver}`, () => {
    let harness: RepositoryHarness;

    const search = (criteria: Partial<OrderCriteria>) =>
      harness.orders.search({ page: 1, limit: 20, sort: 'desc', ...criteria });

    beforeEach(async () => {
      harness = await createRepositoryHarness(driver);
    });

    afterEach(async () => {
      await harness.close();
    });

    it('crea y recupera el pedido con sus líneas en orden y su total', async () => {
      const order = anOrder({ items: [anItem(1500, 2), anItem(800), anItem(250, 4)] });

      await harness.orders.create(order);
      const found = await harness.orders.findById(order.id);

      expect(found?.toSnapshot()).toEqual(order.toSnapshot());
      expect(found?.items.map((item) => item.sku)).toEqual(['SKU-1500', 'SKU-800', 'SKU-250']);
      expect(found?.totalCents).toBe(4800);
      expect(await harness.orders.findById(randomUUID())).toBeNull();
    });

    it('persiste el cambio de estado', async () => {
      const order = anOrder({}, at(0));
      await harness.orders.create(order);

      order.changeStatus('paid', at(1));
      await harness.orders.update(order);

      expect((await harness.orders.findById(order.id))?.toSnapshot()).toEqual(order.toSnapshot());
    });

    it('aplica el criterio ESR: igualdad, orden y rango', async () => {
      const owner = randomUUID();
      const cheap = anOrder({ userId: owner, items: [anItem(1000)] }, at(1));
      const middle = anOrder({ userId: owner, items: [anItem(5000)] }, at(2));
      const pricey = anOrder({ userId: owner, items: [anItem(9000)] }, at(3));
      const foreign = anOrder({ userId: randomUUID(), items: [anItem(5000)] }, at(4));
      middle.changeStatus('paid', at(5));
      for (const order of [cheap, middle, pricey, foreign]) {
        await harness.orders.create(order);
      }

      expect(ids((await search({ userId: owner })).items)).toEqual(ids([pricey, middle, cheap]));
      expect(ids((await search({ userId: owner, status: 'paid' })).items)).toEqual(ids([middle]));
      const ranged = await search({
        userId: owner,
        minTotalCents: 2000,
        maxTotalCents: 9000,
        sort: 'asc',
      });
      expect(ids(ranged.items)).toEqual(ids([middle, pricey]));
      expect((await search({ minTotalCents: 5000, maxTotalCents: 5000 })).total).toBe(2);
    });

    it('pagina con total coherente', async () => {
      const orders = [1, 2, 3, 4, 5].map((minute) => anOrder({}, at(minute)));
      for (const order of orders) {
        await harness.orders.create(order);
      }

      const page = await search({ page: 2, limit: 2, sort: 'asc' });

      expect(page.total).toBe(5);
      expect(page).toMatchObject({ page: 2, limit: 2 });
      expect(ids(page.items)).toEqual(ids([orders[2], orders[3]]));
    });

    it('elimina el pedido con sus líneas', async () => {
      const order = anOrder({ items: [anItem(100), anItem(200)] });
      await harness.orders.create(order);

      expect(await harness.orders.delete(order.id)).toBe(true);
      expect(await harness.orders.delete(order.id)).toBe(false);
      expect(await harness.orders.findById(order.id)).toBeNull();
    });
  });
};
