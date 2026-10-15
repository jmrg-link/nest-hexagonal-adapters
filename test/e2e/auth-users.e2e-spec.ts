import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  createTestApp,
  http,
  loginAs,
  loginAsAdmin,
  registerCustomer,
  type RegisteredUser,
} from '../support/test-app';

describe('REST · auth y CRUD de usuarios con JWT', () => {
  let app: INestApplication;
  let adminToken: string;
  let ana: RegisteredUser;

  beforeAll(async () => {
    app = await createTestApp();
    adminToken = await loginAsAdmin(app);
    ana = await registerCustomer(app, 'ana@mail.com');
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = (token: string) => ({ authorization: `Bearer ${token}` });

  it('registra clientes sin exponer el hash y normaliza el email', async () => {
    const response = await http(app)
      .post('/auth/register')
      .send({ email: 'Luis@Mail.COM', name: 'Luis', password: 'supersecret' })
      .expect(201);

    expect(response.body).toMatchObject({ email: 'luis@mail.com', role: 'customer' });
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('responde Problem Details con el detalle de validación', async () => {
    const response = await http(app)
      .post('/auth/register')
      .send({ email: 'no-es-email', name: 'A', password: '123' })
      .expect(400);

    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.body.code).toBe('BAD_USER_INPUT');
    expect(response.body.errors.map((error: { path: string }) => error.path)).toEqual([
      'email',
      'name',
      'password',
    ]);
  });

  it('devuelve 409 si el email ya existe', async () => {
    const response = await http(app)
      .post('/auth/register')
      .send({ email: 'ana@mail.com', name: 'Ana', password: 'supersecret' })
      .expect(409);

    expect(response.body.code).toBe('CONFLICT');
  });

  it('no distingue entre email inexistente y contraseña incorrecta', async () => {
    const wrongPassword = await http(app)
      .post('/auth/login')
      .send({ email: 'ana@mail.com', password: 'incorrecta' })
      .expect(401);
    const unknownEmail = await http(app)
      .post('/auth/login')
      .send({ email: 'nadie@mail.com', password: 'incorrecta' })
      .expect(401);

    expect(wrongPassword.body.detail).toBe(unknownEmail.body.detail);
  });

  it('exige un JWT válido en las rutas protegidas', async () => {
    await http(app).get('/auth/me').expect(401);
    await http(app).get('/auth/me').set(auth('token.manipulado.x')).expect(401);

    const me = await http(app).get('/auth/me').set(auth(ana.token)).expect(200);

    expect(me.body).toMatchObject({ id: ana.id, email: 'ana@mail.com' });
  });

  it('solo el administrador lista y crea usuarios', async () => {
    await http(app).get('/users').set(auth(ana.token)).expect(403);
    await http(app)
      .post('/users')
      .set(auth(adminToken))
      .send({ email: 'staff@mail.com', name: 'Staff', password: 'supersecret', role: 'admin' })
      .expect(201);

    const page = await http(app)
      .get('/users')
      .query({ role: 'admin', limit: 10 })
      .set(auth(adminToken))
      .expect(200);

    expect(page.body.total).toBe(2);
    expect(page.body.items.every((user: { role: string }) => user.role === 'admin')).toBe(true);
  });

  it('cada cliente gestiona solo su propio perfil y no su rol', async () => {
    const luis = await registerCustomer(app, 'luis.perfil@mail.com');

    await http(app)
      .patch(`/users/${ana.id}`)
      .set(auth(ana.token))
      .send({ name: 'Ana María' })
      .expect(200);
    await http(app)
      .patch(`/users/${ana.id}`)
      .set(auth(ana.token))
      .send({ role: 'admin' })
      .expect(403);
    await http(app).get(`/users/${luis.id}`).set(auth(ana.token)).expect(403);
    await http(app).patch(`/users/${ana.id}`).set(auth(ana.token)).send({}).expect(400);
  });

  it('valida el UUID de la ruta y devuelve 404 si no existe', async () => {
    await http(app).get('/users/no-es-uuid').set(auth(adminToken)).expect(400);
    await http(app).get(`/users/${randomUUID()}`).set(auth(adminToken)).expect(404);
  });

  it('el administrador elimina usuarios', async () => {
    const temporal = await registerCustomer(app, 'temporal@mail.com');

    await http(app).delete(`/users/${temporal.id}`).set(auth(temporal.token)).expect(403);
    await http(app).delete(`/users/${temporal.id}`).set(auth(adminToken)).expect(204);
    await http(app).get(`/users/${temporal.id}`).set(auth(adminToken)).expect(404);
    await expect(loginAs(app, 'temporal@mail.com', 'supersecret')).rejects.toThrow();
  });
});
