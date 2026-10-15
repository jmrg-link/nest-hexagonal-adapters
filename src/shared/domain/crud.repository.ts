import type { Page } from './page';

/**
 * Puerto de salida genérico (patrón Repository) que comparten los agregados.
 * Todos los adaptadores (Mongoose, Prisma, Sequelize, memoria) deben cumplirlo con
 * el mismo comportamiento observable: principio de sustitución de Liskov.
 * @template TEntity Agregado de dominio que se persiste.
 * @template TCriteria Criterio de búsqueda (patrón Criteria).
 */
export interface CrudRepository<TEntity, TCriteria> {
  /**
   * Inserta un agregado nuevo.
   * @param entity Agregado a insertar.
   */
  create(entity: TEntity): Promise<void>;

  /**
   * Persiste el estado mutable de un agregado existente.
   * @param entity Agregado modificado.
   */
  update(entity: TEntity): Promise<void>;

  /**
   * Busca por identificador.
   * @param id Identificador del agregado.
   * @returns El agregado o `null` si no existe.
   */
  findById(id: string): Promise<TEntity | null>;

  /**
   * Busca por criterio, con orden por `createdAt` y paginación.
   * @param criteria Filtros, orden y página.
   * @returns Página de agregados.
   */
  search(criteria: TCriteria): Promise<Page<TEntity>>;

  /**
   * Elimina un agregado.
   * @param id Identificador del agregado.
   * @returns `true` si existía y se ha eliminado.
   */
  delete(id: string): Promise<boolean>;
}
