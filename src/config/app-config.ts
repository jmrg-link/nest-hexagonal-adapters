import { z } from 'zod';
import {
  DATABASE_DRIVERS,
  type DatabaseConfig,
} from '../shared/infrastructure/database/database-driver';

const isPowerOfTwo = (value: number): boolean => Number.isInteger(Math.log2(value));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DB_DRIVER: z.enum(DATABASE_DRIVERS).default('memory'),
  MONGO_URI: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET necesita al menos 32 caracteres'),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().min(60).max(86_400).default(900),
  JWT_ISSUER: z.string().min(1).default('nest-hexagonal-adapters'),
  JWT_AUDIENCE: z.string().min(1).default('nest-hexagonal-adapters-api'),
  SCRYPT_COST: z.coerce
    .number()
    .int()
    .min(1024)
    .max(1_048_576)
    .refine(isPowerOfTwo, 'SCRYPT_COST debe ser potencia de 2')
    .default(131_072),
  ADMIN_EMAIL: z.email().toLowerCase().optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
  CORS_ORIGINS: z.string().optional(),
  GRAPHQL_SCHEMA_FILE: z.string().min(1).optional(),
});

type Env = z.output<typeof envSchema>;

/** Configuración tipada e inmutable de la aplicación (12-factor: todo por entorno). */
export interface AppConfig {
  readonly env: Env['NODE_ENV'];
  readonly isProduction: boolean;
  readonly port: number;
  readonly database: DatabaseConfig;
  readonly jwt: {
    readonly secret: string;
    readonly expiresInSeconds: number;
    readonly issuer: string;
    readonly audience: string;
  };
  readonly scryptCost: number;
  readonly admin?: { readonly email: string; readonly password: string };
  readonly corsOrigins: readonly string[];
  readonly graphqlSchemaFile?: string;
}

/** Token de inyección de la configuración. */
export const APP_CONFIG = Symbol('APP_CONFIG');

const required = (value: string | undefined, name: string, driver: string): string => {
  if (!value) {
    throw new Error(`${name} es obligatorio con DB_DRIVER=${driver}`);
  }
  return value;
};

const toDatabaseConfig = (env: Env): DatabaseConfig => {
  switch (env.DB_DRIVER) {
    case 'memory':
      return { driver: 'memory' };
    case 'mongoose':
      return { driver: 'mongoose', url: required(env.MONGO_URI, 'MONGO_URI', env.DB_DRIVER) };
    default:
      return {
        driver: env.DB_DRIVER,
        url: required(env.DATABASE_URL, 'DATABASE_URL', env.DB_DRIVER),
      };
  }
};

const toAdmin = ({ ADMIN_EMAIL, ADMIN_PASSWORD }: Env): AppConfig['admin'] => {
  if (Boolean(ADMIN_EMAIL) !== Boolean(ADMIN_PASSWORD)) {
    throw new Error('ADMIN_EMAIL y ADMIN_PASSWORD se configuran juntos');
  }
  return ADMIN_EMAIL && ADMIN_PASSWORD
    ? { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    : undefined;
};

const withoutEmptyValues = (source: Record<string, string | undefined>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(source).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );

/**
 * Valida el entorno al arrancar (fail fast) y lo convierte en configuración tipada.
 * @param source Variables de entorno, normalmente `process.env`.
 * @returns Configuración validada.
 * @throws {Error} Si alguna variable falta o no es válida.
 */
export const loadConfig = (source: Record<string, string | undefined>): AppConfig => {
  const result = envSchema.safeParse(withoutEmptyValues(source));
  if (!result.success) {
    throw new Error(`Configuración inválida:\n${z.prettifyError(result.error)}`);
  }
  const env = result.data;
  return {
    env: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    port: env.PORT,
    database: toDatabaseConfig(env),
    jwt: {
      secret: env.JWT_SECRET,
      expiresInSeconds: env.JWT_EXPIRES_IN_SECONDS,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    },
    scryptCost: env.SCRYPT_COST,
    admin: toAdmin(env),
    corsOrigins: env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) ?? [],
    graphqlSchemaFile: env.GRAPHQL_SCHEMA_FILE,
  };
};
