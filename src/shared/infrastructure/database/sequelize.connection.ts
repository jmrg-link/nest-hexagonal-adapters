import { Inject, Injectable, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import { Sequelize, UniqueConstraintError } from 'sequelize';
import { DATABASE_URL } from './database.tokens';

/**
 * Detecta la violación de restricción única de Sequelize.
 * @param error Error lanzado por Sequelize.
 * @returns `true` si es una clave duplicada.
 */
export const isSequelizeUniqueViolation = (error: unknown): boolean =>
  error instanceof UniqueConstraintError;

/**
 * Instancia de Sequelize sobre PostgreSQL. No usa `sync()`: el esquema lo
 * gobiernan las migraciones de `prisma/migrations`, así Prisma y Sequelize
 * comparten exactamente las mismas tablas e índices.
 */
@Injectable()
export class SequelizeConnection implements OnModuleInit, OnApplicationShutdown {
  readonly sequelize: Sequelize;

  constructor(@Inject(DATABASE_URL) url: string) {
    this.sequelize = new Sequelize(url, { dialect: 'postgres', logging: false });
  }

  async onModuleInit(): Promise<void> {
    await this.sequelize.authenticate();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.sequelize.close();
  }
}
