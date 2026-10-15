import type { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  http,
  loginAsAdmin,
  registerCustomer,
  type RegisteredUser,
} from '../support/test-app';

interface OrderBody {
  id: string;
  status: string;
  totalCents: number;
}

describe('REST · pedidos con filtros ESR y máquina de estados', () => {
  let app: INestApplication;
  let adminToken: string;
  let ana: RegisteredUser;
  let luis: RegisteredUser;

  const auth = (token: string) => ({ authorization: `Bearer ${token}` });

  const place = async (user: RegisteredUser, unitPriceCents: number, quantity = 1) => {
    const response = await http(app)
      .post('/orders')
      .set(auth(user.token))
      .send({
        items: [{ sku: `SKU-${unitPriceCents}`, name: 'Producto', quantity, unitPriceCents }],
      })
      .expect(201);
    return response.body as OrderBody;
  };

  beforeAll(async () => {
    app = await createTestApp();
    adminToken = await loginAsAdmin(app);
    ana = await registerCustomer(app, 'ana.pedidos@mail.com');
    luis = await registerCustomer(app, 'luis.pedidos@mail.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('crea pedidos en pending con el total calculado por el dominio', async () => {
    const order = await place(ana, 1500, 2);

    expect(order).toMatchObject({ status: 'pending', totalCents: 3000 });
  });

  it('valida las líneas con Zod antes de llegar al dominio', async () => {
    const response = await http(app)
      .post('/orders')
      .set(auth(ana.token))
      .send({ items: [{ sku: 'X', name: 'X', quantity: 0, unitPriceCents: 100 }] })
      .expect(400);

    expect(response.body.errors[0].path).toBe('items.0.quantity');
  });

  it('cada cliente solo lista sus pedidos y puede filtrar por rango de total', async () => {
    await place(ana, 9000);
    await place(luis, 5000);

    const mine = await http(app).get('/orders').set(auth(ana.token)).expect(200);
    const ranged = await http(app)
      .get('/orders')
      .query({ minTotalCents: 5000, sort: 'asc' })
      .set(auth(ana.token))
      .expect(200);

    expect(mine.body.total).toBe(2);
    expect(ranged.body.items.map((order: OrderBody) => order.totalCents)).toEqual([9000]);
  });

  it('el administrador filtra por usuario y estado', async () => {
    const response = await http(app)
      .get('/orders')
      .query({ userId: luis.id, status: 'pending' })
      .set(auth(adminToken))
      .expect(200);

    expect(response.body.total).toBe(1);
  });

  it('rechaza rangos incoherentes', async () => {
    await http(app)
      .get('/orders')
      .query({ minTotalCents: 10, maxTotalCents: 1 })
      .set(auth(ana.token))
      .expect(400);
  });

  it('aplica la política de acceso al recurso', async () => {
    const order = await place(luis, 700);

    await http(app).get(`/orders/${order.id}`).set(auth(ana.token)).expect(403);
    await http(app).get(`/orders/${order.id}`).set(auth(luis.token)).expect(200);
    await http(app).get(`/orders/${order.id}`).set(auth(adminToken)).expect(200);
  });

  it('el cliente solo cancela; el resto de transiciones son de administración', async () => {
    const order = await place(ana, 1200);
    const status = (value: string, token: string) =>
      http(app).patch(`/orders/${order.id}/status`).set(auth(token)).send({ status: value });

    await status('paid', ana.token).expect(403);
    await status('paid', adminToken).expect(200);
    await status('shipped', adminToken).expect(200);
    const invalid = await status('cancelled', adminToken).expect(422);

    expect(invalid.body.code).toBe('BUSINESS_RULE');
  });

  it('solo el administrador elimina pedidos', async () => {
    const order = await place(ana, 300);

    await http(app).delete(`/orders/${order.id}`).set(auth(ana.token)).expect(403);
    await http(app).delete(`/orders/${order.id}`).set(auth(adminToken)).expect(204);
    await http(app).get(`/orders/${order.id}`).set(auth(adminToken)).expect(404);
  });
});
