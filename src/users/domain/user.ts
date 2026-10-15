import type { Role } from '../../shared/domain/principal';
import { InvalidUserError } from './user.errors';

/** Estado serializable del usuario; es lo que reciben y devuelven los mappers. */
export interface UserSnapshot {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly passwordHash: string;
  readonly role: Role;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Datos necesarios para dar de alta un usuario. */
export type NewUser = Omit<UserSnapshot, 'createdAt' | 'updatedAt'>;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const requireName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new InvalidUserError('El nombre no puede estar vacío');
  }
  return trimmed;
};

/**
 * Agregado User en TypeScript puro: sin decoradores, ORM ni framework.
 * Expone intenciones de negocio en lugar de setters y protege sus invariantes
 * (email normalizado, nombre no vacío, fechas coherentes).
 */
export class User {
  private constructor(private state: UserSnapshot) {}

  /**
   * Crea un usuario nuevo aplicando las invariantes.
   * @param data Datos de alta con el hash ya calculado.
   * @param now Instante de creación (inyectable para tests).
   * @returns Usuario nuevo.
   */
  static create(data: NewUser, now: Date = new Date()): User {
    return new User({
      ...data,
      email: normalizeEmail(data.email),
      name: requireName(data.name),
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Rehidrata un usuario desde persistencia sin alterar su estado.
   * @param snapshot Estado guardado.
   * @returns Usuario rehidratado.
   */
  static restore(snapshot: UserSnapshot): User {
    return new User({ ...snapshot });
  }

  get id(): string {
    return this.state.id;
  }

  get email(): string {
    return this.state.email;
  }

  get name(): string {
    return this.state.name;
  }

  get role(): Role {
    return this.state.role;
  }

  get passwordHash(): string {
    return this.state.passwordHash;
  }

  get createdAt(): Date {
    return this.state.createdAt;
  }

  get updatedAt(): Date {
    return this.state.updatedAt;
  }

  /**
   * Cambia el nombre visible.
   * @param name Nuevo nombre.
   * @param now Instante del cambio.
   */
  rename(name: string, now: Date = new Date()): void {
    this.apply({ name: requireName(name) }, now);
  }

  /**
   * Cambia el email. La unicidad la garantizan la aplicación y el índice único.
   * @param email Nuevo email.
   * @param now Instante del cambio.
   */
  changeEmail(email: string, now: Date = new Date()): void {
    this.apply({ email: normalizeEmail(email) }, now);
  }

  /**
   * Cambia el rol de la cuenta.
   * @param role Nuevo rol.
   * @param now Instante del cambio.
   */
  changeRole(role: Role, now: Date = new Date()): void {
    this.apply({ role }, now);
  }

  /**
   * Sustituye el hash de la contraseña; la contraseña en claro nunca llega aquí.
   * @param passwordHash Nuevo hash.
   * @param now Instante del cambio.
   */
  changePasswordHash(passwordHash: string, now: Date = new Date()): void {
    this.apply({ passwordHash }, now);
  }

  /**
   * Copia inmutable del estado para persistir.
   * @returns Snapshot del usuario.
   */
  toSnapshot(): UserSnapshot {
    return { ...this.state };
  }

  private apply(changes: Partial<UserSnapshot>, now: Date): void {
    this.state = { ...this.state, ...changes, updatedAt: now };
  }
}
