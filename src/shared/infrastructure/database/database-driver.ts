/** Adaptadores de persistencia disponibles; se elige uno con `DB_DRIVER`. */
export const DATABASE_DRIVERS = ['memory', 'mongoose', 'prisma', 'sequelize'] as const;

/** Driver de persistencia. */
export type DatabaseDriver = (typeof DATABASE_DRIVERS)[number];

/** Drivers que necesitan una base de datos real y una URL de conexión. */
export type PersistentDriver = Exclude<DatabaseDriver, 'memory'>;

/** Configuración de persistencia ya validada. */
export type DatabaseConfig =
  { readonly driver: 'memory' } | { readonly driver: PersistentDriver; readonly url: string };
