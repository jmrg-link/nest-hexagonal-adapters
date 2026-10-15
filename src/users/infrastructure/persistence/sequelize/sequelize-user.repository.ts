import { Injectable } from '@nestjs/common';
import { offsetOf, pageOf, type Page } from '../../../../shared/domain/page';
import {
  isSequelizeUniqueViolation,
  SequelizeConnection,
} from '../../../../shared/infrastructure/database/sequelize.connection';
import { guardUnique } from '../../../../shared/infrastructure/database/unique-violation';
import type { User } from '../../../domain/user';
import type { UserCriteria } from '../../../domain/user.criteria';
import { EmailAlreadyInUseError } from '../../../domain/user.errors';
import type { UserRepository } from '../../../domain/user.repository';
import { toUser, toUserRow } from './user-model.mapper';
import { UserModel } from './user.model';

/** Adaptador PostgreSQL (Sequelize) del puerto UserRepository. */
@Injectable()
export class SequelizeUserRepository implements UserRepository {
  private readonly users: typeof UserModel;

  constructor(database: SequelizeConnection) {
    this.users = UserModel.initialize(database.sequelize);
  }

  async create(user: User): Promise<void> {
    await guardUnique(
      () => this.users.create(toUserRow(user)),
      isSequelizeUniqueViolation,
      () => new EmailAlreadyInUseError(user.email),
    );
  }

  async update(user: User): Promise<void> {
    const { id, ...changes } = toUserRow(user);
    await guardUnique(
      () => this.users.update(changes, { where: { id } }),
      isSequelizeUniqueViolation,
      () => new EmailAlreadyInUseError(user.email),
    );
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.users.findByPk(id);
    return row ? toUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.users.findOne({ where: { email } });
    return row ? toUser(row) : null;
  }

  async search(criteria: UserCriteria): Promise<Page<User>> {
    const { rows, count } = await this.users.findAndCountAll({
      where: criteria.role ? { role: criteria.role } : {},
      order: [['createdAt', criteria.sort.toUpperCase()]],
      offset: offsetOf(criteria),
      limit: criteria.limit,
    });
    return pageOf(rows.map(toUser), count, criteria);
  }

  async delete(id: string): Promise<boolean> {
    return (await this.users.destroy({ where: { id } })) === 1;
  }
}
