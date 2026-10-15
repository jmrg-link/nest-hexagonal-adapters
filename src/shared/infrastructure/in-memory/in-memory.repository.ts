import type { CrudRepository } from '../../domain/crud.repository';
import { offsetOf, pageOf, type Page, type PageRequest } from '../../domain/page';

/**
 * Repositorio en memoria con el patrón Template Method: el algoritmo común
 * (guardar, filtrar, ordenar, paginar) vive aquí y cada subclase aporta solo
 * los pasos variables. Guarda snapshots, no referencias, para comportarse como
 * una base de datos real: mutar un agregado no persiste nada sin `update`.
 */
export abstract class InMemoryRepository<
  TEntity extends { readonly id: string },
  TSnapshot extends { readonly createdAt: Date },
  TCriteria extends PageRequest,
> implements CrudRepository<TEntity, TCriteria> {
  protected readonly rows = new Map<string, TSnapshot>();

  protected abstract toSnapshot(entity: TEntity): TSnapshot;

  protected abstract toEntity(snapshot: TSnapshot): TEntity;

  protected abstract matches(snapshot: TSnapshot, criteria: TCriteria): boolean;

  /**
   * Gancho para reglas de unicidad. Por defecto no hay ninguna.
   * @param _entity Agregado que se va a guardar.
   */
  protected assertUnique(_entity: TEntity): void {}

  async create(entity: TEntity): Promise<void> {
    this.assertUnique(entity);
    this.rows.set(entity.id, this.toSnapshot(entity));
  }

  async update(entity: TEntity): Promise<void> {
    this.assertUnique(entity);
    this.rows.set(entity.id, this.toSnapshot(entity));
  }

  async findById(id: string): Promise<TEntity | null> {
    const row = this.rows.get(id);
    return row ? this.toEntity(row) : null;
  }

  async search(criteria: TCriteria): Promise<Page<TEntity>> {
    const direction = criteria.sort === 'asc' ? 1 : -1;
    const matching = [...this.rows.values()]
      .filter((row) => this.matches(row, criteria))
      .sort((a, b) => direction * (a.createdAt.getTime() - b.createdAt.getTime()));
    const start = offsetOf(criteria);
    const items = matching.slice(start, start + criteria.limit).map((row) => this.toEntity(row));
    return pageOf(items, matching.length, criteria);
  }

  async delete(id: string): Promise<boolean> {
    return this.rows.delete(id);
  }

  /**
   * Busca la primera fila que cumple el predicado.
   * @param predicate Condición sobre el snapshot.
   * @returns El agregado o `null`.
   */
  protected findOneWhere(predicate: (row: TSnapshot) => boolean): TEntity | null {
    const row = [...this.rows.values()].find(predicate);
    return row ? this.toEntity(row) : null;
  }
}
