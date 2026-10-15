import { Test, type TestingModule } from '@nestjs/testing';
import { PersistenceModule } from '../../src/app/persistence.module';
import { AppConfigModule } from '../../src/config/app-config.module';
import { ORDER_REPOSITORY, type OrderRepository } from '../../src/orders/domain/order.repository';
import type { DatabaseDriver } from '../../src/shared/infrastructure/database/database-driver';
import { USER_REPOSITORY, type UserRepository } from '../../src/users/domain/user.repository';
import { resetDatabase } from '../support/database-cleaner';
import { testConfig } from '../support/test-config';

export interface RepositoryHarness {
  readonly users: UserRepository;
  readonly orders: OrderRepository;
  close(): Promise<void>;
}

export const createRepositoryHarness = async (
  driver: DatabaseDriver,
): Promise<RepositoryHarness> => {
  const config = testConfig(driver);
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppConfigModule.forRoot(config), PersistenceModule.forRoot(config.database)],
  }).compile();
  await moduleRef.init();
  await resetDatabase(moduleRef, driver);
  return {
    users: moduleRef.get<UserRepository>(USER_REPOSITORY),
    orders: moduleRef.get<OrderRepository>(ORDER_REPOSITORY),
    close: () => moduleRef.close(),
  };
};
