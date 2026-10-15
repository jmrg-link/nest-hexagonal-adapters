import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app/app.module';
import { configureHttpApp } from '../../src/app/http-app';
import type { DatabaseDriver } from '../../src/shared/infrastructure/database/database-driver';
import { AdminSeeder } from '../../src/users/application/admin.seeder';
import { resetDatabase } from './database-cleaner';
import { ADMIN, e2eDriver, testConfig } from './test-config';

export const createTestApp = async (
  driver: DatabaseDriver = e2eDriver(),
): Promise<INestApplication> => {
  const config = testConfig(driver);
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.register(config)],
  }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  configureHttpApp(app, config);
  await app.init();
  await resetDatabase(app, driver);
  await app.get(AdminSeeder).onApplicationBootstrap();
  return app;
};

export const http = (app: INestApplication) => request(app.getHttpServer());

export const loginAs = async (
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> => {
  const response = await http(app).post('/auth/login').send({ email, password }).expect(200);
  return (response.body as { accessToken: string }).accessToken;
};

export const loginAsAdmin = (app: INestApplication): Promise<string> =>
  loginAs(app, ADMIN.email, ADMIN.password);

export interface RegisteredUser {
  readonly id: string;
  readonly email: string;
  readonly token: string;
}

export const registerCustomer = async (
  app: INestApplication,
  email: string,
  password = 'supersecret',
): Promise<RegisteredUser> => {
  const response = await http(app)
    .post('/auth/register')
    .send({ email, name: 'Cliente', password })
    .expect(201);
  const { id } = response.body as { id: string };
  return { id, email, token: await loginAs(app, email, password) };
};

export interface GraphqlResponse<T> {
  readonly data: T | null;
  readonly errors?: { message: string; extensions: { code: string; details?: unknown[] } }[];
}

export const gql = async <T>(
  app: INestApplication,
  query: string,
  variables: Record<string, unknown> = {},
  token?: string,
): Promise<GraphqlResponse<T>> => {
  const call = http(app).post('/graphql').send({ query, variables });
  const response = await (token ? call.set('authorization', `Bearer ${token}`) : call);
  return response.body as GraphqlResponse<T>;
};
