<div align="center">

# Nest Hexagonal Adapters

API de usuarios y pedidos que funciona con MongoDB o con PostgreSQL<br/>
y se consulta por REST o por GraphQL. Las reglas de negocio se escriben una sola vez.

<img alt="Node.js ≥24.9" src="https://img.shields.io/static/v1?label=Node.js&message=%E2%89%A524.9&color=5FA04E&logo=nodedotjs&logoColor=white" />
<img alt="NestJS 12" src="https://img.shields.io/static/v1?label=NestJS&message=12&color=E0234E&logo=nestjs&logoColor=white" />
<img alt="TypeScript 6.0" src="https://img.shields.io/static/v1?label=TypeScript&message=6.0&color=3178C6&logo=typescript&logoColor=white" />
<img alt="GraphQL con Apollo 5" src="https://img.shields.io/static/v1?label=GraphQL&message=Apollo%205&color=E10098&logo=graphql&logoColor=white" />
<img alt="Zod 4" src="https://img.shields.io/static/v1?label=Zod&message=4&color=3E67B1&logo=zod&logoColor=white" />
<br/>
<img alt="MongoDB 7.0" src="https://img.shields.io/static/v1?label=MongoDB&message=7.0&color=47A248&logo=mongodb&logoColor=white" />
<img alt="PostgreSQL 18" src="https://img.shields.io/static/v1?label=PostgreSQL&message=18&color=4169E1&logo=postgresql&logoColor=white" />
<img alt="Mongoose 9" src="https://img.shields.io/static/v1?label=Mongoose&message=9&color=880000" />
<img alt="Prisma 7" src="https://img.shields.io/static/v1?label=Prisma&message=7&color=2D3748&logo=prisma&logoColor=white" />
<img alt="Sequelize 6" src="https://img.shields.io/static/v1?label=Sequelize&message=6&color=52B0E7&logo=sequelize&logoColor=white" />
<img alt="Licencia MIT" src="https://img.shields.io/static/v1?label=licencia&message=MIT&color=blue" />

**[🌐 Diagramas interactivos](https://jmrg-link.github.io/nest-hexagonal-adapters/)** · **[📘 API REST (OpenAPI)](https://jmrg-link.github.io/nest-hexagonal-adapters/api/)** · **[jmrg.dev](https://jmrg.dev)**

[Arranque rápido](#arranque-rápido) · [Explorar la API](#explorar-la-api) · [Diagramas](docs/diagrams/README.md) · [Capturas](docs/capturas/queries-graphql.md) · [Documentación](#documentación) · [Autor](#autor)

</div>

## Qué es

El dominio (usuarios, pedidos y sus reglas) no sabe qué base de datos hay debajo ni por dónde llega la petición. Define unos contratos, los *puertos*, y cada tecnología los implementa con un *adaptador*. Cambiar de Mongo a Postgres es cambiar una variable de entorno, `DB_DRIVER`.

Los cuatro adaptadores pasan el mismo contrato de repositorio y los mismos tests e2e, por REST y por GraphQL. Así se comprueba que se comportan igual.

[![Arquitectura hexagonal del proyecto](docs/diagrams/previews/01-arquitectura-hexagonal.png)](docs/diagrams/README.md)

| `DB_DRIVER` | Tecnología | Base de datos | Cómo guarda las líneas del pedido |
|---|---|---|---|
| `memory` | Map en memoria | — (tests y demos) | Snapshot del agregado |
| `mongoose` | Mongoose 9 | MongoDB 7.0 | **Embebidas** en el documento `orders` |
| `prisma` | Prisma 7 (driver adapter `pg`) | PostgreSQL 18 | Tabla hija `order_items` (1:N) |
| `sequelize` | Sequelize 6 | PostgreSQL 18 | Tabla hija `order_items` (1:N) |

## Arranque rápido

```bash
nvm use                          # Node 24 LTS (.nvmrc)
corepack enable                  # activa el pnpm fijado en packageManager
pnpm install --frozen-lockfile   # también ejecuta `prisma generate`
cp .env.example .env
docker compose up -d             # PostgreSQL 18 + MongoDB 7.0
pnpm exec prisma migrate deploy  # crea tablas e índices (Prisma y Sequelize los comparten)
pnpm start:dev
```

> [!IMPORTANT]
> `JWT_SECRET` necesita al menos 32 caracteres y `ADMIN_PASSWORD` al menos 12. Los valores de `.env.example` son de ejemplo: sirven en local, pero fuera de local hay que sustituirlos. Con `ADMIN_EMAIL` y `ADMIN_PASSWORD` se crea un administrador al arrancar.

> [!NOTE]
> La imagen de Mongo es la 7.0 porque MongoDB 8 necesita un kernel Linux 7.0.14 o superior, y Docker Desktop puede traer uno anterior. Se comprueba con `docker info --format '{{.KernelVersion}}'`.

Para cambiar de base de datos, edita `DB_DRIVER` en `.env` (`memory | mongoose | prisma | sequelize`) y reinicia.

## Explorar la API

| Qué | Dónde |
|---|---|
| REST con Swagger UI | <http://localhost:3000/docs> |
| OpenAPI en JSON | <http://localhost:3000/docs-json> |
| Contrato REST publicado, de solo lectura | <https://jmrg-link.github.io/nest-hexagonal-adapters/api/> |
| GraphQL con GraphiQL | <http://localhost:3000/graphql> |
| Operaciones GraphQL paso a paso, con capturas | [docs/capturas/queries-graphql.md](docs/capturas/queries-graphql.md) |
| Colección y entorno de Postman | [Guía 5](docs/05-openapi-postman-graphql.md#importar-en-postman) |

En producción se desactivan Swagger UI, GraphiQL y la introspección.

[![GraphiQL: listado de pedidos con filtros ESR por variables](docs/capturas/imagenes/09-orders-variables.png)](docs/capturas/queries-graphql.md)

## Datos de ejemplo

```bash
pnpm build
pnpm db:seed
```

Crea 5 clientes y 8 pedidos (dos en cada estado) en la base del `DB_DRIVER` activo. Los clientes son `lucia@`, `diego@`, `sara@`, `pablo@` y `marta@example.com`. Todos comparten la contraseña `SEED_PASSWORD` (mínimo 8 caracteres), y el seed necesita el administrador configurado. Si un email ya existe, ese cliente se salta, así que se puede repetir.

> [!WARNING]
> `build` vacía `dist/` antes de compilar (`deleteOutDir`), y `start:dev` sirve desde esa misma carpeta. Si compilas con `start:dev` en marcha, el servidor se queda sin sus ficheros: páralo antes.

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm start:dev` | Arranque en modo watch |
| `pnpm start:debug` | Igual, con el inspector de Node |
| `pnpm build` / `pnpm start` | Compila a `dist/` y arranca |
| `pnpm test` | Tests de dominio, contrato (memoria) y e2e REST/GraphQL |
| `pnpm test:cov` | Igual, con informe de cobertura en `coverage/` |
| `pnpm test:db` | Igual, en serie, para BBDD reales (ver abajo) |
| `pnpm lint` / `pnpm typecheck` | ESLint (incluye máx. 250 líneas por fichero) y `tsc` |
| `pnpm format` | Prettier sobre `src/` y `test/` |
| `pnpm prisma:migrate` | `prisma migrate deploy` |
| `pnpm prisma:migrate:dev` | `prisma migrate dev`: crea una migración a partir de `schema.prisma` |
| `pnpm db:seed` | Datos de ejemplo; requiere `build` |
| `pnpm docs:generate` | Genera `docs/openapi.json` (Postman) y `docs/schema.gql` |

<details>
<summary><strong>Tests contra bases de datos reales</strong></summary>

> [!CAUTION]
> Los tests **vacían las tablas y colecciones**: usa siempre bases de datos de pruebas.

```bash
# Una sola vez: base de datos de pruebas en PostgreSQL con el esquema migrado
docker compose exec postgres createdb -U app orders_test
DATABASE_URL=postgresql://app:app@localhost:5432/orders_test pnpm exec prisma migrate deploy

# Variables de las BBDD de pruebas
export MONGO_URI=mongodb://localhost:27017/orders_test
export DATABASE_URL=postgresql://app:app@localhost:5432/orders_test

# Contrato de repositorios contra memoria, Mongoose, Prisma y Sequelize
pnpm test:db test/contracts

# Los mismos e2e REST y GraphQL con cada adaptador
E2E_DB_DRIVER=mongoose pnpm test:db test/e2e
E2E_DB_DRIVER=prisma pnpm test:db test/e2e
E2E_DB_DRIVER=sequelize pnpm test:db test/e2e
```

`test:db` usa `--runInBand` porque los tests comparten base de datos.

</details>

## Versiones de las dependencias

Cada dependencia está en la última versión estable que es compatible con el resto, y se instala con versión exacta (`pnpm add -E` para producción y `pnpm add -DE` para desarrollo). `pnpm outdated` muestra solo cuatro diferencias, todas deliberadas:

| Paquete | Instalado | `latest` | Motivo |
|---|---|---|---|
| `typescript` | 6.0.3 | 7.0.2 | `@nestjs/cli`, `@nestjs/graphql`, `@nestjs/swagger`, `typescript-eslint` y `ts-jest` declaran `typescript ^6`. |
| `graphql` | 16.14.2 | 17.0.2 | `@apollo/server` 5 exige `graphql ^16.11`. |
| `prisma` | 7.10.0 | 8.0.0-rc.22 | `latest` apunta a una *release candidate*; el cliente estable es 7.10.0 y CLI y cliente deben coincidir. |
| `@types/node` | 24.x | 26.x | Los tipos deben coincidir con el runtime: Node 24 LTS. |

Prisma 7 todavía no soporta MongoDB (la documentación oficial recomienda Prisma 6.19 para Mongo). Por eso aquí MongoDB va con Mongoose y Prisma contra PostgreSQL.

`pnpm audit --prod` avisa en dependencias transitivas: `deepmerge-ts` del CLI de Prisma, `mysql2` del CLI de Prisma y de Sequelize, y `uuid@8` de Sequelize 6. La «corrección» automática baja a Prisma 6, así que se documentan y se revisan en cada actualización en lugar de aplicar `audit fix --force`.

## Documentación

| # | Guía | Qué cubre |
|---|---|---|
| 1 | [Patrones y buenas prácticas](docs/01-patrones-y-buenas-practicas.md) | Patrones aplicados, la Factory de adaptadores, SOLID con ejemplos del código |
| 2 | [Arquitectura, capas, REST y GraphQL](docs/02-arquitectura-rest-graphql.md) | Capas, regla de dependencias, endpoints, SQL frente a NoSQL |
| 3 | [Auth con JWT y el pipeline de Nest](docs/03-auth-jwt-y-pipeline.md) | Emisión y verificación del token, scrypt, guards, reglas del CRUD |
| 4 | [Regla ESR e índices](docs/04-esr-e-indices.md) | Índices compuestos en MongoDB y PostgreSQL y cómo comprobarlos |
| 5 | [OpenAPI, Postman y GraphQL](docs/05-openapi-postman-graphql.md) | Generar contratos, importar en Postman, GraphiQL y formato de errores |

Material visual:

- [**Diagramas interactivos**](https://jmrg-link.github.io/nest-hexagonal-adapters/) ([índice en el repo](docs/diagrams/README.md)): arquitectura, secuencias REST y GraphQL, ciclo de vida del pedido, errores y dominio.
- [**Operaciones GraphQL con capturas**](docs/capturas/queries-graphql.md): las 13 operaciones y dos errores, ejecutadas en GraphiQL con variables, cabeceras y respuesta.

Ficheros para importar o pegar:

| Fichero | Uso |
|---|---|
| [`docs/openapi.json`](docs/openapi.json) | OpenAPI 3.0; se importa en Postman como colección |
| [`docs/postman-environment.json`](docs/postman-environment.json) | Entorno de Postman con `baseUrl` y las credenciales del admin y de un cliente del seed |
| [`docs/schema.gql`](docs/schema.gql) | Esquema GraphQL |
| [`docs/operations.graphql`](docs/operations.graphql) | Las 13 operaciones GraphQL comentadas, listas para GraphiQL |

## Estructura del código

```text
src/
├── users/        dominio, casos de uso, adaptadores de BBDD, REST y GraphQL de usuarios
├── orders/       ídem para pedidos
├── auth/         registro, login, JWT (jsonwebtoken), scrypt, guards
├── shared/       núcleo compartido: errores, paginación, conexiones, pipeline transversal
├── config/       variables de entorno validadas con Zod al arrancar
├── app/          composition root: AppModule y PersistenceModule (la Factory de adaptadores)
├── generated/    cliente de Prisma (`prisma generate`, no versionado)
├── main.ts
├── generate-docs.ts
└── seed.ts       datos de ejemplo (`pnpm db:seed`)
```

El código se organiza por funcionalidad (`users`, `orders`, `auth`) y no por tipo de fichero, de modo que todo lo relativo a pedidos está en `orders/`. Este enfoque se conoce como *Screaming Architecture*.

## Autor

<table>
  <tr>
    <td>
      <a href="https://github.com/jmrg-link"><img src="https://github.com/jmrg-link.png?size=96" width="72" alt="Jesús María Rico González" /></a>
    </td>
    <td>
      <strong>Jesús María Rico González</strong><br/>
      Senior Full Stack Developer · Node.js, NestJS y arquitecturas limpias<br/>
      <a href="https://jmrg.dev">jmrg.dev</a> ·
      <a href="https://jmrg-link.github.io/nest-hexagonal-adapters/">Diagramas del proyecto</a> ·
      <a href="https://github.com/jmrg-link">GitHub</a> ·
      <a href="https://www.linkedin.com/in/jesus-maria-rico-gonzalez/">LinkedIn</a>
    </td>
  </tr>
</table>

## Licencia

[MIT](LICENSE) © 2026 Jesús María Rico González
