import { Module } from '@nestjs/common';
import { AdminSeeder } from './application/admin.seeder';
import { UsersService } from './application/users.service';
import { UsersController } from './presentation/http/users.controller';
import { UsersResolver } from './presentation/graphql/users.resolver';

/**
 * Módulo de usuarios. No sabe qué base de datos hay: recibe USER_REPOSITORY del
 * composition root (PersistenceModule) y PASSWORD_HASHER de SecurityModule.
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersResolver, AdminSeeder],
  exports: [UsersService],
})
export class UsersModule {}
