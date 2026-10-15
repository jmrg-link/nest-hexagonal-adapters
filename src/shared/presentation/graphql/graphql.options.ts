import type { ApolloDriverConfig } from '@nestjs/apollo';
import type { Request, Response } from 'express';
import type { GraphQLFormattedError } from 'graphql';
import type { AppConfig } from '../../../config/app-config';

const INTERNAL_ERROR = 'INTERNAL_SERVER_ERROR';

const maskInternalErrors =
  (isProduction: boolean) =>
  (formatted: GraphQLFormattedError): GraphQLFormattedError =>
    isProduction && formatted.extensions?.code === INTERNAL_ERROR
      ? { message: 'Error interno', extensions: { code: INTERNAL_ERROR } }
      : formatted;

/**
 * Opciones de Apollo (code-first). En producción se desactivan GraphiQL, la
 * introspección y las trazas, y se ocultan los mensajes de errores inesperados.
 * @param config Configuración de la aplicación.
 * @returns Opciones del driver Apollo sin el propio driver.
 */
export const graphqlOptions = (config: AppConfig): Omit<ApolloDriverConfig, 'driver'> => ({
  autoSchemaFile: config.graphqlSchemaFile ?? true,
  sortSchema: true,
  graphiql: !config.isProduction,
  introspection: !config.isProduction,
  includeStacktraceInErrorResponses: !config.isProduction,
  context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
  formatError: maskInternalErrors(config.isProduction),
});
