import { Injectable } from '@nestjs/common';
import { offsetOf, pageOf, type Page } from '../../../../shared/domain/page';
import {
  isPrismaUniqueViolation,
  PrismaConnection,
} from '../../../../shared/infrastructure/database/prisma.connection';
import { guardUnique } from '../../../../shared/infrastructure/database/unique-violation';
import type { User } from '../../../domain/user';
import type { UserCriteria } from '../../../domain/user.criteria';
import { EmailAlreadyInUseError } from '../../../domain/user.errors';
import type { UserRepository } from '../../../domain/user.repository';
import { toUser, toUserRecord } from './user-record.mapper';

/** Adaptador PostgreSQL (Prisma) del puerto UserRepository. */
@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly database: PrismaConnection) {}

  private get users() {
    return this.database.client.user;
  }

  async create(user: User): Promise<void> {
    await guardUnique(
      () => this.users.create({ data: toUserRecord(user) }),
      isPrismaUniqueViolation,
      () => new EmailAlreadyInUseError(user.email),
    );
  }

  async update(user: User): Promise<void> {
    const { id, ...data } = toUserRecord(user);
    await guardUnique(
      () => this.users.update({ where: { id }, data }),
      isPrismaUniqueViolation,
      () => new EmailAlreadyInUseError(user.email),
    );
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.users.findUnique({ where: { id } });
    return record ? toUser(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.users.findUnique({ where: { email } });
    return record ? toUser(record) : null;
  }

  async search(criteria: UserCriteria): Promise<Page<User>> {
    const where = { role: criteria.role };
    const [records, total] = await this.database.client.$transaction([
      this.users.findMany({
        where,
        orderBy: { createdAt: criteria.sort },
        skip: offsetOf(criteria),
        take: criteria.limit,
      }),
      this.users.count({ where }),
    ]);
    return pageOf(records.map(toUser), total, criteria);
  }

  async delete(id: string): Promise<boolean> {
    const { count } = await this.users.deleteMany({ where: { id } });
    return count === 1;
  }
}
