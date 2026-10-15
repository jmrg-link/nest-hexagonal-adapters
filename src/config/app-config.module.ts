import { type DynamicModule, Module } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from './app-config';

/** Expone la configuración validada como proveedor global e inmutable. */
@Module({})
export class AppConfigModule {
  /**
   * Registra la configuración ya cargada.
   * @param config Configuración validada en el arranque.
   * @returns Módulo dinámico global.
   */
  static forRoot(config: AppConfig): DynamicModule {
    return {
      global: true,
      module: AppConfigModule,
      providers: [{ provide: APP_CONFIG, useValue: config }],
      exports: [APP_CONFIG],
    };
  }
}
