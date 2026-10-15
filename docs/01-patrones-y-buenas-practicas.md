# 1. Patrones y buenas prácticas

La idea central: **el negocio no sabe qué base de datos, qué ORM ni qué transporte hay debajo**. Depende de contratos (puertos) y la infraestructura los implementa (adaptadores). Cambiar MongoDB por PostgreSQL, o REST por GraphQL, no toca ni el dominio ni los casos de uso.

> [!TIP]
> En visual: [arquitectura hexagonal](https://jmrg-link.github.io/nest-hexagonal-adapters/diagrams/01-arquitectura-hexagonal.html) y [dominio y reglas de negocio](https://jmrg-link.github.io/nest-hexagonal-adapters/diagrams/06-dominio-y-reglas-de-negocio.html) ([vista previa](diagrams/README.md)).

## Patrones aplicados

| Patrón | Dónde | Para qué |
|---|---|---|
| **Ports & Adapters (hexagonal)** | `*/domain/*.repository.ts`, `auth/domain/*.port.ts` | El dominio define interfaces; la infraestructura las implementa |
| **Adapter** | `mongoose-*.repository.ts`, `prisma-*.repository.ts`, `sequelize-*.repository.ts`, `jsonwebtoken-token.service.ts`, `scrypt-password.hasher.ts` | Traducen una API ajena (ORM, librería) al contrato del dominio |
| **Repository** | `shared/domain/crud.repository.ts` | Colección de agregados: `create`, `update`, `findById`, `search`, `delete` |
| **Factory + Strategy** | `bindAdapter()` y `AdapterRegistry` en `shared/infrastructure/database/database.providers.ts`, usados en `app/persistence.module.ts` | Elige el adaptador según `DB_DRIVER` en un único sitio |
| **Composition Root** | `app/app.module.ts`, `app/persistence.module.ts` | El único lugar que conoce a la vez puertos y adaptadores |
| **Criteria** | `user.criteria.ts`, `order.criteria.ts` | Consulta expresada en el dominio; cada adaptador la traduce a su lenguaje |
| **Data Mapper** | `*.mapper.ts` | Convierte agregado ↔ documento, registro o fila sin contaminar el dominio |
| **Aggregate + Value Object** | `Order` + `OrderItem`, `User` | Invariantes protegidas: total calculado, importe máximo, email normalizado |
| **State** (tabla de transiciones) | `orders/domain/order-status.ts` | `pending → paid → shipped`, `cancelled`; sin `if` repartidos ([diagrama](https://jmrg-link.github.io/nest-hexagonal-adapters/diagrams/04-ciclo-de-vida-pedido.html)) |
| **Template Method** | `shared/infrastructure/in-memory/in-memory.repository.ts` | Algoritmo común; las subclases aportan `toSnapshot`, `toEntity` y `matches` |
| **Presenter** | `user.presenter.ts`, `order.presenter.ts` | Lista blanca de campos públicos, compartida por REST y GraphQL |
| **Chain of Responsibility** | Pipeline de Nest | Middleware → guards → interceptor → pipe → handler → filtro |
| **Decorator** | `@Public()`, `@Roles()`, `@CurrentPrincipal()` | Metadatos declarativos que leen los guards |
| **Generic type factory** | `Paginated()` en `common.types.ts` | Un tipo GraphQL de página para cualquier entidad |

## La Factory de adaptadores

```ts
export const USER_REPOSITORY_ADAPTERS: AdapterRegistry<UserRepository> = {
  memory: InMemoryUserRepository,
  mongoose: MongooseUserRepository,
  prisma: PrismaUserRepository,
  sequelize: SequelizeUserRepository,
};

export const bindAdapter = <TPort>(token: symbol, registry: AdapterRegistry<TPort>, driver: DatabaseDriver) =>
  ({ provide: token, useClass: registry[driver] });

providers: [
  ...databaseProviders(database),
  bindAdapter(USER_REPOSITORY, USER_REPOSITORY_ADAPTERS, database.driver),
  bindAdapter(ORDER_REPOSITORY, ORDER_REPOSITORY_ADAPTERS, database.driver),
]
```

`UsersService` solo pide `@Inject(USER_REPOSITORY) users: UserRepository`. No importa nada de Mongoose, Prisma ni Sequelize.

### ¿Un proyecto con adaptadores o un proyecto por base de datos?

| Opción | A favor | En contra |
|---|---|---|
| **Un proyecto, varios adaptadores** (elegida) | Dominio y casos de uso escritos una vez (DRY). Un mismo contrato de tests comprueba que los adaptadores son intercambiables (Liskov). Cambiar de BBDD es configuración | Se instalan todas las librerías de BBDD |
| Un proyecto por base de datos | Despliegues más ligeros | Se duplica dominio, servicios y tests, y acaban divergiendo |
| Monorepo: `packages/domain` + `apps/api-mongo`, `apps/api-postgres` | Comparte dominio y despliega por separado | Más infraestructura de build. Tendría sentido si cada base de datos fuese un servicio distinto |

## SOLID con ejemplos del código

- **S**: cada fichero tiene una razón para cambiar. El mapper cambia si cambia el esquema de BBDD; el servicio, si cambia el caso de uso; el controller, si cambia HTTP.
- **O**: un driver nuevo es una clase más en el registro, sin tocar servicios. Un estado de pedido nuevo es una entrada más en `TRANSITIONS`.
- **L**: `test/contracts/*` ejecuta **el mismo contrato** contra los cuatro adaptadores. Si uno se comporta distinto, el test falla. Un ejemplo es el email duplicado: Mongo devuelve E11000, Prisma P2002 y Sequelize `UniqueConstraintError`, y los tres se traducen a `EmailAlreadyInUseError` con `guardUnique()`. `ArgsSchemaPipe` extiende `StandardSchemaValidationPipe` sin romper su contrato.
- **I**: puertos pequeños. `TokenService` tiene 2 métodos, `PasswordHasher` 2 y `UserRepository` añade solo `findByEmail` al CRUD común.
- **D**: los casos de uso dependen de abstracciones (tokens `Symbol` + interfaces) y Nest inyecta las implementaciones.

## DRY, KISS y YAGNI: decisiones concretas

- **Un esquema Zod, tres usos**: valida REST (`@Body({ schema })`), valida GraphQL (`ArgsSchemaPipe`) y genera OpenAPI. Los tipos de los DTO se infieren con `z.output`.
- **Un único filtro de errores** traduce los errores de dominio a Problem Details (REST) o `extensions.code` (GraphQL).
- **Prisma y Sequelize comparten la misma migración SQL**: el esquema relacional se define en un único sitio.
- **KISS**: paginación por offset, HS256 con secreto compartido, sin CQRS ni eventos. Hay mejoras posibles (keyset pagination, RS256/JWKS, outbox), pero no se han añadido porque hoy no hacen falta (YAGNI).

## Buenas prácticas incluidas

- **Validación del entorno al arrancar**: si falta una variable o no es válida, la aplicación no arranca (`config/app-config.ts`).
- **Rutas protegidas por defecto**: `JwtAuthGuard` es global, así que una ruta solo es pública si se marca con `@Public()`.
- **Dinero en céntimos enteros** y un importe máximo por pedido (invariante del agregado).
- **IDs y fechas los genera la aplicación**, no la BBDD, así todos los adaptadores se comportan igual.
- **Agregados referenciados por id**: `orders.user_id` no tiene FK hacia `users` y los pedidos sobreviven a la baja del usuario. Dentro del agregado sí hay FK y `ON DELETE CASCADE` entre `orders` y `order_items`.
- **Invariantes también en la BBDD**: `CHECK (quantity > 0)` en PostgreSQL y `min` en el esquema Mongoose.
- **Versiones exactas** (`-SE`/`-DE`) y **última estable compatible** (ver README).

## Convenciones del código

- Sufijos con significado: `*.repository.ts` (puerto o adaptador), `*.port.ts`, `*.mapper.ts`, `*.schemas.ts`, `*.service.ts`, `*.controller.ts`, `*.resolver.ts`, `*.types.ts` (GraphQL), `*.guard.ts`, `*.filter.ts`, `*.interceptor.ts`, `*.middleware.ts`.
- Adaptadores con nombre `tecnología-entidad.repository.ts`, siempre con la misma forma: modelo, mapper y repositorio.
- **Sin comentarios en línea** (`no-inline-comments`); se documenta con **JSDoc** en clases y funciones públicas (`eslint-plugin-jsdoc`).
- **Máximo 250 líneas por fichero**, comprobado por ESLint (`max-lines`).
- Prettier + ESLint 10 (flat config) + `tsc --strict`.

---

[Índice](../README.md#documentación) · [Siguiente: Arquitectura, capas, REST y GraphQL →](02-arquitectura-rest-graphql.md)
