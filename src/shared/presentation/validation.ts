import {
  type ArgumentMetadata,
  StandardSchemaValidationPipe,
  type StandardSchemaValidationPipeOptions,
} from '@nestjs/common';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { InvalidInputError, type ErrorDetail } from '../domain/domain-error';

const pathOf = (issue: StandardSchemaV1.Issue): string =>
  (issue.path ?? [])
    .map((segment) => String(typeof segment === 'object' ? segment.key : segment))
    .join('.');

/**
 * Convierte las incidencias de Standard Schema (Zod) en el error común de entrada.
 * @param issues Incidencias de validación.
 * @returns Error de dominio con el detalle por campo.
 */
export const toInvalidInputError = (issues: readonly StandardSchemaV1.Issue[]): InvalidInputError =>
  new InvalidInputError(
    issues.map((issue): ErrorDetail => ({ path: pathOf(issue), message: issue.message })),
  );

/** Opciones compartidas por la validación REST (pipe global) y GraphQL. */
export const validationOptions: StandardSchemaValidationPipeOptions = {
  exceptionFactory: toInvalidInputError,
};

/**
 * Valida argumentos GraphQL con el mismo esquema Zod que usa REST. `@Args()` no
 * acepta la opción `schema` de NestJS 12, así que este pipe la inyecta en los
 * metadatos y delega en el pipe nativo: es un StandardSchemaValidationPipe (Liskov).
 */
export class ArgsSchemaPipe extends StandardSchemaValidationPipe {
  constructor(private readonly schema: StandardSchemaV1) {
    super(validationOptions);
  }

  override transform<T = unknown>(value: T, metadata: ArgumentMetadata): Promise<T> {
    return super.transform(value, { ...metadata, schema: this.schema });
  }
}
