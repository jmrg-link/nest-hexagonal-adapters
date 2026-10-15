import { MAX_ORDER_TOTAL_CENTS, Order } from '../../src/orders/domain/order';
import {
  InvalidOrderError,
  InvalidOrderTransitionError,
} from '../../src/orders/domain/order.errors';
import { anItem, anOrder, at } from '../support/builders';

describe('Order (agregado)', () => {
  it('nace en pending y calcula el total desde sus líneas', () => {
    const order = anOrder({ items: [anItem(1500, 2), anItem(800)] });

    expect(order.status).toBe('pending');
    expect(order.totalCents).toBe(3800);
    expect(order.items.map((item) => item.subtotalCents)).toEqual([3000, 800]);
  });

  it('exige al menos una línea', () => {
    expect(() => anOrder({ items: [] })).toThrow(InvalidOrderError);
  });

  it('valida cantidades y precios enteros', () => {
    expect(() => anOrder({ items: [anItem(1000, 0)] })).toThrow(InvalidOrderError);
    expect(() => anOrder({ items: [anItem(10.5)] })).toThrow(InvalidOrderError);
  });

  it('no supera el importe máximo del pedido', () => {
    const tooExpensive = anItem(MAX_ORDER_TOTAL_CENTS, 2);

    expect(() => anOrder({ items: [tooExpensive] })).toThrow(InvalidOrderError);
  });

  it('avanza por la máquina de estados y actualiza updatedAt', () => {
    const order = anOrder({}, at(0));

    order.changeStatus('paid', at(5));
    order.changeStatus('shipped', at(10));

    expect(order.status).toBe('shipped');
    expect(order.updatedAt).toEqual(at(10));
    expect(order.createdAt).toEqual(at(0));
  });

  it('rechaza transiciones no permitidas', () => {
    const order = anOrder();
    order.changeStatus('cancelled');

    expect(() => order.changeStatus('paid')).toThrow(InvalidOrderTransitionError);
  });

  it('se rehidrata desde su snapshot sin perder información', () => {
    const order = anOrder({ items: [anItem(1200, 3)] }, at(1));

    const restored = Order.restore(order.toSnapshot());

    expect(restored.toSnapshot()).toEqual(order.toSnapshot());
  });
});
