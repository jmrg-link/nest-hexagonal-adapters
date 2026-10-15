import { Inject, Injectable, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import { createConnection, type Connection, type Model, type Schema } from 'mongoose';
import { APP_CONFIG, type AppConfig } from '../../../config/app-config';
import { DATABASE_URL } from './database.tokens';

const MONGO_DUPLICATE_KEY = 11000;

/**
 * Detecta la violación de índice único de MongoDB (E11000).
 * @param error Error lanzado por el driver.
 * @returns `true` si es una clave duplicada.
 */
export const isMongoDuplicateKey = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === MONGO_DUPLICATE_KEY;

/**
 * Conexión Mongoose propia en lugar de la global de `mongoose`: permite instancias
 * aisladas (tests) y se cierra con el ciclo de vida de Nest. En producción
 * `autoIndex` se desactiva y los índices se crean en el despliegue.
 */
@Injectable()
export class MongooseConnection implements OnModuleInit, OnApplicationShutdown {
  readonly connection: Connection;

  constructor(@Inject(DATABASE_URL) url: string, @Inject(APP_CONFIG) config: AppConfig) {
    this.connection = createConnection(url, { autoIndex: !config.isProduction });
  }

  /**
   * Registra el modelo una sola vez por conexión y lo devuelve.
   * @param name Nombre del modelo.
   * @param schema Esquema Mongoose.
   * @returns Modelo ligado a esta conexión.
   */
  model<T>(name: string, schema: Schema<T>): Model<T> {
    const registered = this.connection.models[name] as Model<T> | undefined;
    return registered ?? this.connection.model<T>(name, schema);
  }

  async onModuleInit(): Promise<void> {
    await this.connection.asPromise();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.connection.close();
  }
}
