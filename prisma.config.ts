import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const url = process.env.DATABASE_URL;

/**
 * Configuración de Prisma 7: la URL vive aquí (ya no en schema.prisma).
 * Sin DATABASE_URL solo se omite el datasource, así `prisma generate`
 * funciona en `npm install` aunque el driver activo no sea Prisma.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  ...(url ? { datasource: { url } } : {}),
});
