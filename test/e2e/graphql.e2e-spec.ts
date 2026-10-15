import type { INestApplication } from '@nestjs/common';
import { createTestApp, gql, loginAsAdmin } from '../support/test-app';

const REGISTER = `mutation Register($input: RegisterInput!) {
  register(input: $input) { id email role }
}`;

const LOGIN = `mutation Login($input: LoginInput!) {
  login(input: $input) { accessToken tokenType expiresIn }
}`;

const CREATE_ORDER = `mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) { id status totalCents items { sku subtotalCents } }
}`;

const ORDERS = `query Orders($filter: OrderFilterInput) {
  orders(filter: $filter) { total page limit items { totalCents status } }
}`;

describe('GraphQL · mismas operaciones que REST', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    await gql(app, REGISTER, {
      input: { email: 'eva@mail.com', name: 'Eva', password: 'supersecret' },
    });
    const login = await gql<{ login: { accessToken: string } }>(app, LOGIN, {
      input: { email: 'eva@mail.com', password: 'supersecret' },
    });
    token = login.data?.login.accessToken ?? '';
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra y autentica con mutaciones', () => {
    expect(token).toMatch(/^ey/);
  });

  it('resuelve me con el JWT y los enums en mayúsculas', async () => {
    const response = await gql<{ me: { email: string; role: string } }>(
      app,
      '{ me { email role createdAt } }',
      {},
      token,
    );

    expect(response.data?.me).toMatchObject({ email: 'eva@mail.com', role: 'CUSTOMER' });
  });

  it('crea pedidos y los filtra con el criterio ESR', async () => {
    for (const unitPriceCents of [1000, 4000, 8000]) {
      await gql(
        app,
        CREATE_ORDER,
        {
          input: { items: [{ sku: 'G-1', name: 'Gafas', quantity: 1, unitPriceCents }] },
        },
        token,
      );
    }

    const response = await gql<{ orders: { total: number; items: { totalCents: number }[] } }>(
      app,
      ORDERS,
      { filter: { minTotalCents: 2000, status: 'PENDING', sort: 'ASC', limit: 1 } },
      token,
    );

    expect(response.data?.orders.total).toBe(2);
    expect(response.data?.orders.items.map((order) => order.totalCents)).toEqual([4000]);
  });

  it('usa los mismos códigos de error que REST', async () => {
    const unauthenticated = await gql(app, '{ me { id } }');
    const forbidden = await gql(app, '{ users { total } }', {}, token);
    const invalid = await gql(app, REGISTER, {
      input: { email: 'no-es-email', name: 'E', password: '1' },
    });

    expect(unauthenticated.errors?.[0].extensions.code).toBe('UNAUTHENTICATED');
    expect(forbidden.errors?.[0].extensions.code).toBe('FORBIDDEN');
    expect(invalid.errors?.[0].extensions.code).toBe('BAD_USER_INPUT');
    expect(invalid.errors?.[0].extensions.details).toHaveLength(3);
  });

  it('el administrador consulta usuarios paginados', async () => {
    const adminToken = await loginAsAdmin(app);

    const response = await gql<{ users: { total: number } }>(
      app,
      '{ users(filter: { role: CUSTOMER }) { total items { email } } }',
      {},
      adminToken,
    );

    expect(response.data?.users.total).toBe(1);
  });
});
