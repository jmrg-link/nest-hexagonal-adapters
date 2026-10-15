import type { ArgumentsHost, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext, type GqlContextType } from '@nestjs/graphql';
import type { Request } from 'express';
import type { Principal } from '../domain/principal';

/** Petición HTTP enriquecida por el middleware (requestId) y los guards (principal). */
export interface RequestContext extends Request {
  requestId?: string;
  principal?: Principal;
}

/**
 * Indica si el contexto de ejecución pertenece a una operación GraphQL.
 * @param host Contexto de Nest.
 * @returns `true` para GraphQL, `false` para REST.
 */
export const isGraphql = (host: ArgumentsHost): boolean =>
  host.getType<GqlContextType>() === 'graphql';

/**
 * Obtiene la petición tanto en REST como en GraphQL: guards, decoradores e
 * interceptores la leen desde aquí y funcionan igual en ambos transportes (DRY).
 * @param context Contexto de ejecución.
 * @returns Petición con su contexto.
 */
export const getRequest = (context: ExecutionContext): RequestContext =>
  isGraphql(context)
    ? GqlExecutionContext.create(context).getContext<{ req: RequestContext }>().req
    : context.switchToHttp().getRequest<RequestContext>();
