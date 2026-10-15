import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module';
import { AuthService } from './application/auth.service';
import { AuthResolver } from './presentation/graphql/auth.resolver';
import { AuthController } from './presentation/http/auth.controller';
import { JwtAuthGuard } from './presentation/jwt-auth.guard';
import { RolesGuard } from './presentation/roles.guard';

/**
 * Módulo de autenticación. Registra los guards globales en este orden:
 * primero JwtAuthGuard (¿quién eres?) y después RolesGuard (¿qué puedes hacer?).
 */
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthResolver,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
