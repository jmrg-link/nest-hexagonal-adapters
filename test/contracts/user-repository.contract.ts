import { randomUUID } from 'node:crypto';
import type { DatabaseDriver } from '../../src/shared/infrastructure/database/database-driver';
import { EmailAlreadyInUseError } from '../../src/users/domain/user.errors';
import { aUser, at } from '../support/builders';
import { createRepositoryHarness, type RepositoryHarness } from './repository-harness';

export const describeUserRepositoryContract = (driver: DatabaseDriver): void => {
  describe(`UserRepository · ${driver}`, () => {
    let harness: RepositoryHarness;

    beforeEach(async () => {
      harness = await createRepositoryHarness(driver);
    });

    afterEach(async () => {
      await harness.close();
    });

    it('crea y recupera por id y por email', async () => {
      const user = aUser({ email: 'ana@mail.com' });

      await harness.users.create(user);

      expect((await harness.users.findById(user.id))?.toSnapshot()).toEqual(user.toSnapshot());
      expect((await harness.users.findByEmail('ana@mail.com'))?.id).toBe(user.id);
      expect(await harness.users.findById(randomUUID())).toBeNull();
      expect(await harness.users.findByEmail('nadie@mail.com')).toBeNull();
    });

    it('traduce la clave duplicada a EmailAlreadyInUseError', async () => {
      await harness.users.create(aUser({ email: 'dup@mail.com' }));

      await expect(harness.users.create(aUser({ email: 'dup@mail.com' }))).rejects.toBeInstanceOf(
        EmailAlreadyInUseError,
      );
    });

    it('persiste los cambios con update', async () => {
      const user = aUser({}, at(0));
      await harness.users.create(user);

      user.rename('Nombre nuevo', at(1));
      user.changeRole('admin', at(2));
      await harness.users.update(user);

      expect((await harness.users.findById(user.id))?.toSnapshot()).toEqual(user.toSnapshot());
    });

    it('impide cambiar a un email que ya existe', async () => {
      const taken = aUser({ email: 'taken@mail.com' });
      const user = aUser();
      await harness.users.create(taken);
      await harness.users.create(user);

      user.changeEmail('taken@mail.com');

      await expect(harness.users.update(user)).rejects.toBeInstanceOf(EmailAlreadyInUseError);
    });

    it('filtra por rol (E), ordena por createdAt (S) y pagina', async () => {
      const customers = [1, 2, 3].map((minute) => aUser({ role: 'customer' }, at(minute)));
      for (const user of [...customers, aUser({ role: 'admin' }, at(4))]) {
        await harness.users.create(user);
      }

      const newest = await harness.users.search({
        role: 'customer',
        page: 1,
        limit: 2,
        sort: 'desc',
      });
      const oldest = await harness.users.search({
        role: 'customer',
        page: 2,
        limit: 2,
        sort: 'asc',
      });
      const everyone = await harness.users.search({ page: 1, limit: 10, sort: 'asc' });

      expect(newest.total).toBe(3);
      expect(newest.items.map((user) => user.id)).toEqual([customers[2].id, customers[1].id]);
      expect(oldest.items.map((user) => user.id)).toEqual([customers[2].id]);
      expect(everyone.total).toBe(4);
    });

    it('elimina y devuelve si existía', async () => {
      const user = aUser();
      await harness.users.create(user);

      expect(await harness.users.delete(user.id)).toBe(true);
      expect(await harness.users.delete(user.id)).toBe(false);
      expect(await harness.users.findById(user.id)).toBeNull();
    });
  });
};
