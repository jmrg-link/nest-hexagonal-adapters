/** Dirección de ordenación por fecha de creación. */
export type SortDirection = 'asc' | 'desc';

/** Petición de página: paginación por offset y orden por `createdAt`. */
export interface PageRequest {
  readonly page: number;
  readonly limit: number;
  readonly sort: SortDirection;
}

/** Página de resultados con el total para que el cliente pueda paginar. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

/**
 * Número de elementos que hay que saltar para la página pedida.
 * @param request Página solicitada.
 * @returns Offset absoluto.
 */
export const offsetOf = (request: PageRequest): number => (request.page - 1) * request.limit;

/**
 * Construye una página a partir de sus elementos y del total.
 * @param items Elementos de la página.
 * @param total Total de elementos que cumplen el criterio.
 * @param request Página solicitada.
 * @returns Página con metadatos.
 */
export const pageOf = <T>(items: readonly T[], total: number, request: PageRequest): Page<T> => ({
  items,
  total,
  page: request.page,
  limit: request.limit,
});

/**
 * Transforma los elementos conservando los metadatos de paginación.
 * @param page Página de origen.
 * @param mapper Transformación de cada elemento.
 * @returns Página transformada.
 */
export const mapPage = <T, R>(page: Page<T>, mapper: (item: T) => R): Page<R> => ({
  ...page,
  items: page.items.map((item) => mapper(item)),
});
