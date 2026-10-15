import { NestFactory } from '@nestjs/core';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app/app.module';
import { loadConfig } from './config/app-config';
import { createOpenApiDocument } from './shared/presentation/http/openapi';

const DOCS_DIR = 'docs';

/**
 * Genera `docs/openapi.json` (importable en Postman) y `docs/schema.gql`
 * (esquema GraphQL code-first) sin base de datos, con el driver en memoria.
 */
async function generateDocs(): Promise<void> {
  mkdirSync(DOCS_DIR, { recursive: true });
  const config = loadConfig({
    NODE_ENV: 'development',
    DB_DRIVER: 'memory',
    JWT_SECRET: randomBytes(32).toString('hex'),
    GRAPHQL_SCHEMA_FILE: join(DOCS_DIR, 'schema.gql'),
  });
  const app = await NestFactory.create(AppModule.register(config), { logger: false });
  await app.init();
  const document = createOpenApiDocument(app);
  writeFileSync(join(DOCS_DIR, 'openapi.json'), `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
}

generateDocs().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
