import type { INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import type { AppConfig } from '../config/app-config';

/**
 * Configuración HTTP común a `main.ts`, los tests e2e y la generación de docs,
 * para que todos ejecuten exactamente la misma cadena (DRY).
 * En desarrollo se relaja la CSP para que funcionen Swagger UI y GraphiQL.
 * @param app Aplicación Nest.
 * @param config Configuración validada.
 */
export const configureHttpApp = (app: INestApplication, config: AppConfig): void => {
  app.use(helmet({ contentSecurityPolicy: config.isProduction ? undefined : false }));
  if (config.corsOrigins.length > 0) {
    app.enableCors({ origin: [...config.corsOrigins] });
  }
};
