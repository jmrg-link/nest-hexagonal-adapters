import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { existsSync } from 'node:fs';
import { AppModule } from './app/app.module';
import { configureHttpApp } from './app/http-app';
import { loadConfig } from './config/app-config';
import { createOpenApiDocument } from './shared/presentation/http/openapi';

/** Arranca la API: valida el entorno, construye el módulo raíz y escucha. */
async function bootstrap(): Promise<void> {
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }
  const config = loadConfig(process.env);
  const app = await NestFactory.create(AppModule.register(config));
  configureHttpApp(app, config);
  app.enableShutdownHooks();
  if (!config.isProduction) {
    SwaggerModule.setup('docs', app, createOpenApiDocument(app));
  }
  await app.listen(config.port);
  new Logger('Bootstrap').log(
    `http://localhost:${config.port} · REST /docs · GraphQL /graphql · DB_DRIVER=${config.database.driver}`,
  );
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
