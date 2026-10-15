import { loadConfig, type AppConfig } from '../../src/config/app-config';
import {
  DATABASE_DRIVERS,
  type DatabaseDriver,
} from '../../src/shared/infrastructure/database/database-driver';

export const ADMIN = { email: 'admin@test.dev', password: 'admin-password-123' } as const;

export const testConfig = (driver: DatabaseDriver = 'memory'): AppConfig =>
  loadConfig({
    NODE_ENV: 'test',
    DB_DRIVER: driver,
    MONGO_URI: process.env.MONGO_URI,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: 'test-secret-with-more-than-thirty-two-characters',
    SCRYPT_COST: '1024',
    ADMIN_EMAIL: ADMIN.email,
    ADMIN_PASSWORD: ADMIN.password,
  });

export const availableDrivers = (): DatabaseDriver[] => [
  'memory',
  ...(process.env.MONGO_URI ? (['mongoose'] as const) : []),
  ...(process.env.DATABASE_URL ? (['prisma', 'sequelize'] as const) : []),
];

export const e2eDriver = (): DatabaseDriver => {
  const driver = process.env.E2E_DB_DRIVER ?? 'memory';
  const known = DATABASE_DRIVERS.find((candidate) => candidate === driver);
  if (!known) {
    throw new Error(`E2E_DB_DRIVER desconocido: ${driver}`);
  }
  return known;
};
