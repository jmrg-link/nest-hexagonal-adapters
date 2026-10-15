import { z } from 'zod';

/** Identificador UUID para rutas REST y argumentos GraphQL. */
export const idSchema = z.uuid().describe('Identificador UUID');

/**
 * Campos de paginación reutilizables. `z.coerce` acepta strings (query REST)
 * y números (GraphQL): el mismo esquema sirve a los dos transportes.
 */
export const pageRequestShape = {
  page: z.coerce.number().int().min(1).default(1).describe('Página, empezando en 1'),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe('Elementos por página (máx. 100)'),
  sort: z.enum(['asc', 'desc']).default('desc').describe('Orden por fecha de creación'),
};

/**
 * Esquema de salida de una página de elementos.
 * @param item Esquema de cada elemento.
 * @returns Esquema de la página.
 */
export const pageViewSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
  });
