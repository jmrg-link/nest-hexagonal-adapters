import { type DynamicModule, Module } from '@nestjs/common';
import { ORDER_REPOSITORY } from '../orders/domain/order.repository';
import { ORDER_REPOSITORY_ADAPTERS } from '../orders/infrastructure/persistence/order-repository.adapters';
import type { DatabaseConfig } from '../shared/infrastructure/database/database-driver';
import {
  bindAdapter,
  databaseProviders,
} from '../shared/infrastructure/database/database.providers';
import { USER_REPOSITORY } from '../users/domain/user.repository';
import { USER_REPOSITORY_ADAPTERS } from '../users/infrastructure/persistence/user-repository.adapters';

/**
 * Composition root de la persistencia: el único sitio que conoce a la vez los
 * puertos y los adaptadores. Los módulos de negocio solo piden USER_REPOSITORY u
 * ORDER_REPOSITORY; cambiar de base de datos es cambiar `DB_DRIVER`.
 */
@Module({})
export class PersistenceModule {
  /**
   * Registra la conexión y los adaptadores del driver activo.
   * @param database Configuración de persistencia validada.
   * @returns Módulo dinámico global.
   */
  static forRoot(database: DatabaseConfig): DynamicModule {
    return {
      global: true,
      module: PersistenceModule,
      providers: [
        ...databaseProviders(database),
        bindAdapter(USER_REPOSITORY, USER_REPOSITORY_ADAPTERS, database.driver),
        bindAdapter(ORDER_REPOSITORY, ORDER_REPOSITORY_ADAPTERS, database.driver),
      ],
      exports: [USER_REPOSITORY, ORDER_REPOSITORY],
    };
  }
}
