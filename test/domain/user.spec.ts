import { InvalidUserError } from '../../src/users/domain/user.errors';
import { aUser, at } from '../support/builders';

describe('User (agregado)', () => {
  it('normaliza el email y recorta el nombre', () => {
    const user = aUser({ email: '  Ana@Mail.COM ', name: '  Ana  ' });

    expect(user.email).toBe('ana@mail.com');
    expect(user.name).toBe('Ana');
  });

  it('rechaza un nombre vacío', () => {
    expect(() => aUser({ name: '   ' })).toThrow(InvalidUserError);
  });

  it('expone intenciones de negocio que actualizan updatedAt', () => {
    const user = aUser({}, at(0));

    user.rename('Ana María', at(1));
    user.changeEmail('NUEVO@mail.com', at(2));
    user.changeRole('admin', at(3));

    expect(user.toSnapshot()).toMatchObject({
      name: 'Ana María',
      email: 'nuevo@mail.com',
      role: 'admin',
      createdAt: at(0),
      updatedAt: at(3),
    });
  });

  it('devuelve copias del estado, no referencias', () => {
    const user = aUser();
    const snapshot = user.toSnapshot();

    user.rename('Otro nombre');

    expect(snapshot.name).not.toBe('Otro nombre');
  });
});
