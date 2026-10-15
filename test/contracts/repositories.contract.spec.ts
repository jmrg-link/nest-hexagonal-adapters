import { availableDrivers } from '../support/test-config';
import { describeOrderRepositoryContract } from './order-repository.contract';
import { describeUserRepositoryContract } from './user-repository.contract';

/**
 * Principio de sustitución de Liskov como test: el MISMO contrato se ejecuta
 * contra cada adaptador. Memoria siempre; Mongo con MONGO_URI; Prisma y Sequelize
 * con DATABASE_URL (ejecutar con --runInBand: comparten base de datos).
 */
describe.each(availableDrivers())('Contrato de repositorios · %s', (driver) => {
  describeUserRepositoryContract(driver);
  describeOrderRepositoryContract(driver);
});
