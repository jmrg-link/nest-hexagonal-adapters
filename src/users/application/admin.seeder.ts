import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../../config/app-config';
import { EmailAlreadyInUseError } from '../domain/user.errors';
import { UsersService } from './users.service';

/**
 * Crea el administrador inicial al arrancar si se configuró y aún no existe.
 * Es idempotente y tolera que otra instancia lo cree a la vez.
 */
@Injectable()
export class AdminSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly users: UsersService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const admin = this.config.admin;
    if (!admin || (await this.users.findByEmail(admin.email))) {
      return;
    }
    try {
      await this.users.create({ ...admin, name: 'Administrador', role: 'admin' });
      this.logger.log(`Administrador inicial creado: ${admin.email}`);
    } catch (error) {
      if (!(error instanceof EmailAlreadyInUseError)) {
        throw error;
      }
    }
  }
}
