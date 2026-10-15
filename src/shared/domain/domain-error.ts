/**
 * Códigos de error estables y agnósticos del transporte.
 * REST los traduce a un status HTTP y GraphQL a `extensions.code`.
 */
export type ErrorCode =
  'BAD_USER_INPUT' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'BUSINESS_RULE';

/** Detalle de un problema concreto, por ejemplo un campo inválido. */
export interface ErrorDetail {
  readonly path: string;
  readonly message: string;
}

/**
 * Raíz de los errores esperados (de negocio o de aplicación).
 * Todo error que no herede de aquí se trata como fallo inesperado (500).
 */
export abstract class DomainError extends Error {
  abstract readonly code: ErrorCode;

  protected constructor(
    message: string,
    readonly details: readonly ErrorDetail[] = [],
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** La entrada no cumple el contrato del esquema. */
export class InvalidInputError extends DomainError {
  override readonly code = 'BAD_USER_INPUT';

  constructor(details: readonly ErrorDetail[]) {
    super('La entrada no es válida', details);
  }
}

/** Falta la identidad o no es válida. */
export abstract class UnauthenticatedError extends DomainError {
  override readonly code = 'UNAUTHENTICATED';
}

/** La identidad no tiene permiso sobre el recurso o la operación. */
export class AccessDeniedError extends DomainError {
  override readonly code = 'FORBIDDEN';

  constructor() {
    super('No tienes permisos para esta operación');
  }
}

/** El recurso solicitado no existe. */
export abstract class NotFoundError extends DomainError {
  override readonly code = 'NOT_FOUND';
}

/** La operación choca con el estado actual, por ejemplo una clave única. */
export abstract class ConflictError extends DomainError {
  override readonly code = 'CONFLICT';
}

/** Se viola una regla de negocio o una invariante del dominio. */
export abstract class BusinessRuleError extends DomainError {
  override readonly code = 'BUSINESS_RULE';
}
