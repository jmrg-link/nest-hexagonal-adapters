import { Inject, Injectable, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../../../generated/prisma/client';
import { DATABASE_URL } from './database.tokens';

/**
 * Detecta la violación de restricción única de Prisma (P2002).
 * @param error Error lanzado por Prisma.
 * @returns `true` si es una clave duplicada.
 */
export const isPrismaUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

/**
 * Cliente Prisma 7: sin motor Rust, con driver adapter de `pg`.
 * La URL llega por DI, no por `schema.prisma`.
 */
@Injectable()
export class PrismaConnection implements OnModuleInit, OnApplicationShutdown {
  readonly client: PrismaClient;

  constructor(@Inject(DATABASE_URL) url: string) {
    this.client = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.$disconnect();
  }
}
