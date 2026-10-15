import type { ClassProvider, Provider, Type } from '@nestjs/common';
import type { DatabaseConfig, DatabaseDriver, PersistentDriver } from './database-driver';
import { DATABASE_URL } from './database.tokens';
import { MongooseConnection } from './mongoose.connection';
import { PrismaConnection } from './prisma.connection';
import { SequelizeConnection } from './sequelize.connection';

const CONNECTIONS: Readonly<Record<PersistentDriver, Type>> = {
  mongoose: MongooseConnection,
  prisma: PrismaConnection,
  sequelize: SequelizeConnection,
};

/** Registro driver → clase adaptadora para un puerto concreto. */
export type AdapterRegistry<TPort> = Readonly<Record<DatabaseDriver, Type<TPort>>>;

/**
 * Proveedores de conexión del driver activo; ninguno con el driver en memoria.
 * @param database Configuración de persistencia.
 * @returns Proveedores de Nest.
 */
export const databaseProviders = (database: DatabaseConfig): Provider[] =>
  database.driver === 'memory'
    ? []
    : [{ provide: DATABASE_URL, useValue: database.url }, CONNECTIONS[database.driver]];

/**
 * Enlaza el token de un puerto con el adaptador del driver activo. Es una Strategy
 * que elige una Factory en el composition root: añadir un driver es registrar una
 * clase más, sin tocar servicios, controladores ni resolvers (Open/Closed).
 * @param token Token del puerto.
 * @param registry Adaptadores disponibles por driver.
 * @param driver Driver activo.
 * @returns Proveedor de clase para Nest.
 */
export const bindAdapter = <TPort>(
  token: symbol,
  registry: AdapterRegistry<TPort>,
  driver: DatabaseDriver,
): ClassProvider<TPort> => ({ provide: token, useClass: registry[driver] });
