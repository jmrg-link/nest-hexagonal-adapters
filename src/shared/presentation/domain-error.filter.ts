import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { GraphQLError } from 'graphql';
import { DomainError, type ErrorCode } from '../domain/domain-error';
import { isGraphql, type RequestContext } from './request-context';

const STATUS_BY_CODE: Readonly<Record<ErrorCode, HttpStatus>> = {
  BAD_USER_INPUT: HttpStatus.BAD_REQUEST,
  UNAUTHENTICATED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  BUSINESS_RULE: HttpStatus.UNPROCESSABLE_ENTITY,
};

const TITLE_BY_CODE: Readonly<Record<ErrorCode, string>> = {
  BAD_USER_INPUT: 'Entrada no válida',
  UNAUTHENTICATED: 'No autenticado',
  FORBIDDEN: 'Acceso denegado',
  NOT_FOUND: 'Recurso no encontrado',
  CONFLICT: 'Conflicto',
  BUSINESS_RULE: 'Regla de negocio incumplida',
};

/**
 * Traduce los errores de dominio al protocolo de entrada. REST responde con
 * Problem Details (RFC 9457) y GraphQL con un GraphQLError con `extensions.code`.
 * El dominio nunca conoce HTTP ni GraphQL: la traducción vive en la frontera.
 */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter<DomainError> {
  catch(error: DomainError, host: ArgumentsHost): GraphQLError | undefined {
    const status = STATUS_BY_CODE[error.code];
    if (isGraphql(host)) {
      return new GraphQLError(error.message, {
        extensions: { code: error.code, status, details: error.details },
      });
    }
    const http = host.switchToHttp();
    const request = http.getRequest<RequestContext>();
    http
      .getResponse<Response>()
      .status(status)
      .type('application/problem+json')
      .json({
        type: 'about:blank',
        title: TITLE_BY_CODE[error.code],
        status,
        detail: error.message,
        code: error.code,
        instance: request.originalUrl,
        requestId: request.requestId,
        errors: error.details.length > 0 ? error.details : undefined,
      });
    return undefined;
  }
}
