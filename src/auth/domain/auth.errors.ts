import { UnauthenticatedError } from '../../shared/domain/domain-error';

/** Email o contraseña incorrectos; el mensaje no revela cuál de los dos falla. */
export class InvalidCredentialsError extends UnauthenticatedError {
  constructor() {
    super('Credenciales inválidas');
  }
}

/** Falta el token, está mal firmado, ha caducado o no es para esta API. */
export class InvalidTokenError extends UnauthenticatedError {
  constructor() {
    super('Token ausente, inválido o caducado');
  }
}
