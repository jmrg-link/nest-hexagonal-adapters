import type { AdapterRegistry } from '../../../shared/infrastructure/database/database.providers';
import type { UserRepository } from '../../domain/user.repository';
import { InMemoryUserRepository } from './in-memory/in-memory-user.repository';
import { MongooseUserRepository } from './mongoose/mongoose-user.repository';
import { PrismaUserRepository } from './prisma/prisma-user.repository';
import { SequelizeUserRepository } from './sequelize/sequelize-user.repository';

/** Adaptadores disponibles del puerto UserRepository, uno por driver. */
export const USER_REPOSITORY_ADAPTERS: AdapterRegistry<UserRepository> = {
  memory: InMemoryUserRepository,
  mongoose: MongooseUserRepository,
  prisma: PrismaUserRepository,
  sequelize: SequelizeUserRepository,
};
