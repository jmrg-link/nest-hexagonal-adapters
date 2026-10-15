import { BusinessRuleError, ConflictError, NotFoundError } from '../../shared/domain/domain-error';

/** El usuario no existe. */
export class UserNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Usuario ${id} no encontrado`);
  }
}

/** El email ya pertenece a otra cuenta. */
export class EmailAlreadyInUseError extends ConflictError {
  constructor(email: string) {
    super(`El email ${email} ya está registrado`);
  }
}

/** Se ha violado una invariante del usuario. */
export class InvalidUserError extends BusinessRuleError {
  constructor(reason: string) {
    super(reason);
  }
}
