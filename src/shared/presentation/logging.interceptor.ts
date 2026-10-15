import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { GraphQLResolveInfo } from 'graphql';
import { type Observable, tap } from 'rxjs';
import { getRequest, isGraphql } from './request-context';

const describe = (context: ExecutionContext): string => {
  if (isGraphql(context)) {
    const info = GqlExecutionContext.create(context).getInfo<GraphQLResolveInfo>();
    return `GraphQL ${info.parentType.name}.${info.fieldName}`;
  }
  const request = getRequest(context);
  return `${request.method} ${request.originalUrl}`;
};

/**
 * Registra cada operación con su requestId y su duración, en REST y GraphQL.
 * Es transversal (AOP): ningún controlador ni resolver sabe que existe.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Request');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = performance.now();
    const label = `[${getRequest(context).requestId ?? '-'}] ${describe(context)}`;
    const elapsed = (): string => `${(performance.now() - startedAt).toFixed(1)} ms`;
    return next.handle().pipe(
      tap({
        next: () => this.logger.log(`${label} ok ${elapsed()}`),
        error: (error: unknown) =>
          this.logger.warn(
            `${label} ${error instanceof Error ? error.name : 'Error'} ${elapsed()}`,
          ),
      }),
    );
  }
}
