import type { Type } from '@nestjs/common';
import { Field, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import type { SortDirection } from '../../domain/page';

/**
 * Registra un enum GraphQL a partir de la tupla de valores del dominio: el
 * dominio no depende de enums de TypeScript ni de GraphQL (DRY).
 * @param values Valores permitidos, por ejemplo `ROLES`.
 * @param name Nombre del enum en el esquema.
 * @returns Objeto enum para `@Field(() => ...)`.
 */
export const graphqlEnum = <const TValue extends string>(
  values: readonly TValue[],
  name: string,
): Record<string, TValue> => {
  const enumObject = Object.fromEntries(values.map((value) => [value.toUpperCase(), value]));
  registerEnumType(enumObject, { name });
  return enumObject as Record<string, TValue>;
};

/** Enum GraphQL de la dirección de ordenación. */
export const SortDirectionEnum = graphqlEnum(['asc', 'desc'] as const, 'SortDirection');

/** Campos de paginación comunes a todos los filtros GraphQL. */
@InputType({ isAbstract: true })
export class PageInput {
  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => SortDirectionEnum, { nullable: true })
  sort?: SortDirection;
}

/** Forma de una página de resultados en GraphQL. */
export interface PageShape<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Crea el tipo GraphQL de una página para un tipo de elemento (generic type factory).
 * @param itemType Tipo GraphQL de cada elemento.
 * @returns Clase abstracta de la que heredan `UserPage`, `OrderPage`...
 */
export const Paginated = <T>(itemType: Type<T>): Type<PageShape<T>> => {
  @ObjectType({ isAbstract: true })
  abstract class PageType implements PageShape<T> {
    @Field(() => [itemType])
    items!: T[];

    @Field(() => Int)
    total!: number;

    @Field(() => Int)
    page!: number;

    @Field(() => Int)
    limit!: number;
  }
  return PageType as unknown as Type<PageShape<T>>;
};
