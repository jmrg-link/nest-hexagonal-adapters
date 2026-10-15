import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { existsSync } from 'node:fs';
import { AppModule } from './app/app.module';
import { loadConfig, type AppConfig } from './config/app-config';
import { OrdersService } from './orders/application/orders.service';
import type { OrderItemProps } from './orders/domain/order-item';
import type { OrderStatus } from './orders/domain/order-status';
import type { Principal } from './shared/domain/principal';
import { UsersService } from './users/application/users.service';
import type { User } from './users/domain/user';

interface SeedOrder {
  readonly items: readonly OrderItemProps[];
  readonly statuses: readonly OrderStatus[];
}

interface SeedCustomer {
  readonly email: string;
  readonly name: string;
  readonly orders: readonly SeedOrder[];
}

const MIN_PASSWORD_LENGTH = 8;

const line = (sku: string, name: string, unitPriceCents: number, quantity = 1): OrderItemProps => ({
  sku,
  name,
  quantity,
  unitPriceCents,
});

const KEYBOARD = line('KB-001', 'Teclado mecánico', 8900);
const MOUSE = line('MS-002', 'Ratón inalámbrico', 2990);
const MONITOR = line('MN-003', 'Monitor 27"', 32900);
const CABLE = line('CB-004', 'Cable USB-C', 990, 3);
const HEADSET = line('HS-005', 'Auriculares', 5990);

const CUSTOMERS: readonly SeedCustomer[] = [
  {
    email: 'lucia@example.com',
    name: 'Lucía Martín',
    orders: [
      { items: [KEYBOARD, MOUSE], statuses: ['paid', 'shipped'] },
      { items: [CABLE], statuses: [] },
    ],
  },
  {
    email: 'diego@example.com',
    name: 'Diego Romero',
    orders: [
      { items: [MONITOR], statuses: ['paid'] },
      { items: [HEADSET, CABLE], statuses: ['cancelled'] },
    ],
  },
  {
    email: 'sara@example.com',
    name: 'Sara Gil',
    orders: [
      { items: [line('MN-003', 'Monitor 27"', 32900, 2), KEYBOARD], statuses: ['paid', 'shipped'] },
      { items: [MOUSE], statuses: ['paid'] },
      { items: [HEADSET], statuses: [] },
    ],
  },
  {
    email: 'pablo@example.com',
    name: 'Pablo Navarro',
    orders: [{ items: [CABLE, MOUSE], statuses: ['paid', 'cancelled'] }],
  },
  {
    email: 'marta@example.com',
    name: 'Marta Ruiz',
    orders: [],
  },
];

const requireSeedPassword = (value: string | undefined): string => {
  if (!value || value.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`SEED_PASSWORD es obligatorio, con al menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }
  return value;
};

const requireAdmin = (config: AppConfig): string => {
  if (!config.admin) {
    throw new Error('El seed necesita ADMIN_EMAIL y ADMIN_PASSWORD para mover los pedidos de estado');
  }
  return config.admin.email;
};

const toPrincipal = (user: User): Principal => ({
  userId: user.id,
  email: user.email,
  role: user.role,
});

/**
 * Da de alta un cliente y sus pedidos con los casos de uso de la aplicación.
 * Si el email ya existe no toca nada, así el seed se puede repetir sin duplicar.
 * @returns `true` si el cliente se ha creado.
 */
async function seedCustomer(
  customer: SeedCustomer,
  password: string,
  admin: Principal,
  users: UsersService,
  orders: OrdersService,
): Promise<boolean> {
  if (await users.findByEmail(customer.email)) {
    return false;
  }
  const user = await users.create({ ...customer, password, role: 'customer' });
  for (const seedOrder of customer.orders) {
    const order = await orders.place({ items: [...seedOrder.items] }, toPrincipal(user));
    for (const status of seedOrder.statuses) {
      await orders.changeStatus(order.id, { status }, admin);
    }
  }
  return true;
}

/**
 * Siembra clientes y pedidos de ejemplo en la base del `DB_DRIVER` activo.
 * Pasa por los servicios de aplicación, no por los repositorios: los datos
 * cumplen las mismas reglas que los creados por la API y sirve con cualquier driver.
 * @throws {Error} Si falta SEED_PASSWORD, el administrador o la configuración no es válida.
 */
async function seed(): Promise<void> {
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }
  const config = loadConfig(process.env);
  const password = requireSeedPassword(process.env.SEED_PASSWORD);
  const adminEmail = requireAdmin(config);
  const app = await NestFactory.create(AppModule.register(config), { logger: ['error', 'warn'] });
  await app.init();
  const users = app.get(UsersService);
  const orders = app.get(OrdersService);
  const adminUser = await users.findByEmail(adminEmail);
  if (!adminUser) {
    throw new Error(`No existe el administrador ${adminEmail}`);
  }
  let created = 0;
  for (const customer of CUSTOMERS) {
    if (await seedCustomer(customer, password, toPrincipal(adminUser), users, orders)) {
      created += 1;
    }
  }
  Logger.overrideLogger(['log', 'warn', 'error']);
  new Logger('Seed').log(
    `DB_DRIVER=${config.database.driver} · ${created} clientes nuevos de ${CUSTOMERS.length}`,
  );
  await app.close();
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
