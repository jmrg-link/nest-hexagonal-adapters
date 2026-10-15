import { Injectable } from '@nestjs/common';
import { InMemoryRepository } from '../../../../shared/infrastructure/in-memory/in-memory.repository';
import { User, type UserSnapshot } from '../../../domain/user';
import type { UserCriteria } from '../../../domain/user.criteria';
import { EmailAlreadyInUseError } from '../../../domain/user.errors';
import type { UserRepository } from '../../../domain/user.repository';

/** Adaptador en memoria del puerto UserRepository (tests y demos sin BBDD). */
@Injectable()
export class InMemoryUserRepository
  extends InMemoryRepository<User, UserSnapshot, UserCriteria>
  implements UserRepository
{
  async findByEmail(email: string): Promise<User | null> {
    return this.findOneWhere((row) => row.email === email);
  }

  protected override toSnapshot(user: User): UserSnapshot {
    return user.toSnapshot();
  }

  protected override toEntity(snapshot: UserSnapshot): User {
    return User.restore(snapshot);
  }

  protected override matches(row: UserSnapshot, criteria: UserCriteria): boolean {
    return !criteria.role || row.role === criteria.role;
  }

  protected override assertUnique(user: User): void {
    const taken = [...this.rows.values()].some(
      (row) => row.email === user.email && row.id !== user.id,
    );
    if (taken) {
      throw new EmailAlreadyInUseError(user.email);
    }
  }
}
