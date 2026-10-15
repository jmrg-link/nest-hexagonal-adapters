import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  type OpenAPIObject,
  type StandardSchemaConverter,
  SwaggerModule,
} from '@nestjs/swagger';
import { z } from 'zod';

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};

/**
 * Conversor Zod → OpenAPI 3.0. Zod 4 genera JSON Schema de forma nativa; aquí solo
 * se traduce `z.date()` (las vistas devuelven Date) a `string` date-time y se mueven
 * los esquemas con `.meta({ id })` a `components.schemas` para que Postman los nombre.
 * @param schema Esquema declarado en `@Body`, `@Query`, `@Param` o `standardSchema`.
 * @param options Si el esquema describe la entrada o la salida.
 * @returns Esquema OpenAPI y sus componentes, o `undefined` si no es Zod.
 */
export const zodToOpenApi: StandardSchemaConverter = (schema, options) => {
  if (!(schema instanceof z.ZodType)) {
    return undefined;
  }
  const { definitions, $defs, $schema, ...root } = z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io: options.schemaType,
    unrepresentable: 'any',
    override: ({ zodSchema, jsonSchema }) => {
      if (zodSchema._zod.def.type === 'date') {
        Object.assign(jsonSchema, { type: 'string', format: 'date-time' });
      }
    },
  });
  return { schema: root, components: { ...asRecord(definitions), ...asRecord($defs) } };
};

/**
 * Construye el documento OpenAPI a partir de los esquemas Zod de los controladores.
 * Se usa en Swagger UI (`/docs`) y en `npm run docs:generate` para Postman.
 * @param app Aplicación Nest inicializada.
 * @returns Documento OpenAPI.
 */
export const createOpenApiDocument = (app: INestApplication): OpenAPIObject =>
  SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Users & Orders API')
      .setDescription(
        'Misma API sobre Mongoose, Prisma o Sequelize (DB_DRIVER). REST + GraphQL en /graphql.',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .build(),
    { standardSchemaConverter: zodToOpenApi },
  );
