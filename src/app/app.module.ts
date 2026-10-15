import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import {
  type DynamicModule,
  type MiddlewareConsumer,
  Module,
  type NestModule,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { AuthModule } from '../auth/auth.module';
import { SecurityModule } from '../auth/infrastructure/security.module';
import type { AppConfig } from '../config/app-config';
import { AppConfigModule } from '../config/app-config.module';
import { OrdersModule } from '../orders/orders.module';
import { DomainErrorFilter } from '../shared/presentation/domain-error.filter';
import { graphqlOptions } from '../shared/presentation/graphql/graphql.options';
import { RequestIdMiddleware } from '../shared/presentation/http/request-id.middleware';
import { LoggingInterceptor } from '../shared/presentation/logging.interceptor';
import { validationOptions } from '../shared/presentation/validation';
import { UsersModule } from '../users/users.module';
import { PersistenceModule } from './persistence.module';

/**
 * Composition root. Cablea infraestructura (config, persistencia, seguridad,
 * GraphQL) con los módulos de negocio y registra la cadena transversal:
 * middleware → guards → interceptor → pipe → handler → filtro de errores.
 */
@Module({})
export class AppModule implements NestModule {
  /**
   * Construye la aplicación para una configuración concreta (también en tests).
   * @param config Configuración validada.
   * @returns Módulo raíz.
   */
  static register(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        AppConfigModule.forRoot(config),
        PersistenceModule.forRoot(config.database),
        SecurityModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          ...graphqlOptions(config),
        }),
        UsersModule,
        OrdersModule,
        AuthModule,
      ],
      providers: [
        {
          provide: APP_PIPE,
          useFactory: () => new StandardSchemaValidationPipe(validationOptions),
        },
        { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
        { provide: APP_FILTER, useClass: DomainErrorFilter },
      ],
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('{*path}');
  }
}
