import type { INestApplicationContext } from '@nestjs/common';
import type { DatabaseDriver } from '../../src/shared/infrastructure/database/database-driver';
import { MongooseConnection } from '../../src/shared/infrastructure/database/mongoose.connection';
import { PrismaConnection } from '../../src/shared/infrastructure/database/prisma.connection';
import { SequelizeConnection } from '../../src/shared/infrastructure/database/sequelize.connection';

const TRUNCATE_SQL = 'TRUNCATE TABLE order_items, orders, users';

export const resetDatabase = async (
  context: INestApplicationContext,
  driver: DatabaseDriver,
): Promise<void> => {
  switch (driver) {
    case 'mongoose': {
      const { connection } = context.get(MongooseConnection);
      await Promise.all(
        Object.values(connection.collections).map((collection) => collection.deleteMany({})),
      );
      return;
    }
    case 'prisma':
      await context.get(PrismaConnection).client.$executeRawUnsafe(TRUNCATE_SQL);
      return;
    case 'sequelize':
      await context.get(SequelizeConnection).sequelize.query(TRUNCATE_SQL);
      return;
    case 'memory':
      return;
  }
};
