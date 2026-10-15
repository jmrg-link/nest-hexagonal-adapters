import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { Model } from 'mongoose';
import { offsetOf, pageOf, type Page } from '../../../../shared/domain/page';
import {
  isMongoDuplicateKey,
  MongooseConnection,
} from '../../../../shared/infrastructure/database/mongoose.connection';
import { guardUnique } from '../../../../shared/infrastructure/database/unique-violation';
import type { User } from '../../../domain/user';
import type { UserCriteria } from '../../../domain/user.criteria';
import { EmailAlreadyInUseError } from '../../../domain/user.errors';
import type { UserRepository } from '../../../domain/user.repository';
import { toUser, toUserDocument } from './user-document.mapper';
import { USER_MODEL, userSchema, type UserDocument } from './user.document';

/** Adaptador MongoDB (Mongoose) del puerto UserRepository. */
@Injectable()
export class MongooseUserRepository implements UserRepository, OnModuleInit {
  private readonly users: Model<UserDocument>;

  constructor(database: MongooseConnection) {
    this.users = database.model(USER_MODEL, userSchema);
  }

  async onModuleInit(): Promise<void> {
    await this.users.init();
  }

  async create(user: User): Promise<void> {
    await guardUnique(
      () => this.users.create(toUserDocument(user)),
      isMongoDuplicateKey,
      () => new EmailAlreadyInUseError(user.email),
    );
  }

  async update(user: User): Promise<void> {
    const { _id, ...changes } = toUserDocument(user);
    await guardUnique(
      () => this.users.updateOne({ _id }, { $set: changes }).exec(),
      isMongoDuplicateKey,
      () => new EmailAlreadyInUseError(user.email),
    );
  }

  async findById(id: string): Promise<User | null> {
    const document = await this.users.findById(id).lean<UserDocument>().exec();
    return document ? toUser(document) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const document = await this.users.findOne({ email }).lean<UserDocument>().exec();
    return document ? toUser(document) : null;
  }

  async search(criteria: UserCriteria): Promise<Page<User>> {
    const filter = criteria.role ? { role: criteria.role } : {};
    const [documents, total] = await Promise.all([
      this.users
        .find(filter)
        .sort({ createdAt: criteria.sort === 'asc' ? 1 : -1 })
        .skip(offsetOf(criteria))
        .limit(criteria.limit)
        .lean<UserDocument[]>()
        .exec(),
      this.users.countDocuments(filter).exec(),
    ]);
    return pageOf(documents.map(toUser), total, criteria);
  }

  async delete(id: string): Promise<boolean> {
    const { deletedCount } = await this.users.deleteOne({ _id: id }).exec();
    return deletedCount === 1;
  }
}
