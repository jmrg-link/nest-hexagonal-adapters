# 5. OpenAPI para Postman y GraphQL

## Generar los contratos

```bash
pnpm build
pnpm docs:generate
```

Genera, sin base de datos (driver `memory`):

- `docs/openapi.json`: **OpenAPI 3.0** con todos los endpoints, parámetros y esquemas nombrados (`User`, `Order`, `CreateOrderRequest`...). Sale de los esquemas Zod de los controladores.
- `docs/schema.gql`: el esquema GraphQL *code-first*, ordenado.

Con `GRAPHQL_SCHEMA_FILE=docs/schema.gql`, `start:dev` también reescribe `docs/schema.gql` en cada arranque.

`build` vacía `dist/` (`deleteOutDir`), y `start:dev` sirve desde esa carpeta. Si `start:dev` está en marcha, páralo antes de compilar.

Con la API arrancada en desarrollo también están disponibles en vivo:

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs-json`
- GraphiQL: `http://localhost:3000/graphql`

En producción Swagger UI, GraphiQL y la introspección se desactivan.

## Importar en Postman

1. **Import → File → `docs/openapi.json`** (o **Link** con `http://localhost:3000/docs-json`).
2. Elige **"Postman Collection"**. Se crea una carpeta por tag: `auth`, `users`, `orders`.
3. **Import → File → `docs/postman-environment.json`** y selecciona el entorno *nest-hexagonal-adapters · local* arriba a la derecha. Trae `baseUrl`, `adminEmail`, `adminPassword`, `customerEmail` (`lucia@example.com`) y `customerPassword`. Las dos contraseñas vienen vacías: rellénalas con `ADMIN_PASSWORD` y `SEED_PASSWORD` de tu `.env`. Sin el entorno, define `baseUrl = http://localhost:3000` en **Variables** de la colección.
4. **Authorization** de la colección: tipo *Bearer Token*, valor `{{token}}`.
5. En la petición `POST /auth/login`, cuerpo `{ "email": "{{adminEmail}}", "password": "{{adminPassword}}" }` y en la pestaña **Scripts → Post-response**:

```js
pm.collectionVariables.set('token', pm.response.json().accessToken);
```

A partir de ahí, todas las peticiones protegidas llevan el JWT automáticamente. El entorno no define `token` a propósito: una variable de entorno con ese nombre taparía la de colección que guarda el script, y se seguiría enviando el token viejo.

Orden recomendado para probar:

1. `POST /auth/register` con `{ "email": "ana@mail.com", "name": "Ana", "password": "supersecret" }`.
2. `POST /auth/login`, que guarda el `token`.
3. `GET /auth/me`.
4. `POST /orders` con `{ "items": [{ "sku": "A1", "name": "Libro", "quantity": 2, "unitPriceCents": 1500 }] }`.
5. `GET /orders?status=pending&minTotalCents=1000&sort=desc`.
6. Para las rutas de admin, haz login con `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

## GraphQL en GraphiQL

`docs/operations.graphql` reúne las 13 operaciones del esquema, comentadas: `Register`, `Login`, `Me`, `Users`, `User`, `CreateUser`, `UpdateUser`, `DeleteUser`, `Orders`, `Order`, `CreateOrder`, `UpdateOrderStatus` y `DeleteOrder`.

1. Abre `http://localhost:3000/graphql` y pega el fichero entero en el editor.
2. Ejecuta `Login` con `ADMIN_EMAIL` / `ADMIN_PASSWORD`, o con un cliente del seed (`lucia@example.com` y `SEED_PASSWORD`).
3. Pestaña **Headers**:

   ```json
   { "Authorization": "Bearer <accessToken>" }
   ```

4. Pon el cursor dentro de una operación y pulsa ▶ o `Ctrl+Enter`.

> [!IMPORTANT]
> El token va en **Headers**, no en *Variables*, y con el prefijo `Bearer `. Caduca a los `JWT_EXPIRES_IN_SECONDS` (900 s por defecto): un `UNAUTHENTICATED` suele pedir repetir `Login`.

Los marcadores `PEGA-UN-UUID-DE-USUARIO` y `PEGA-UN-UUID-DE-PEDIDO` se sustituyen por ids sacados de `Users` y `Orders`.

Así queda una operación protegida, con el token en Headers:

[![GraphiQL: query Me con la cabecera Authorization Bearer](capturas/imagenes/03-me-headers.png)](capturas/queries-graphql.md)

> [!TIP]
> [Operaciones GraphQL con capturas](capturas/queries-graphql.md) recorre las 13 operaciones con variables, más dos errores, ejecutadas en GraphiQL.

## GraphQL en Postman

1. **New → GraphQL**, URL `{{baseUrl}}/graphql`.
2. Pestaña **Schema**: *Use GraphQL introspection* (en desarrollo) o importa `docs/schema.gql`.
3. **Authorization**: *Bearer Token* `{{token}}`.

Las operaciones de ejemplo son las de `docs/operations.graphql` (sección anterior); en Postman se pega una por petición.

Con variables (pestaña *Variables*):

```graphql
query Orders($filter: OrderFilterInput) {
  orders(filter: $filter) { total items { totalCents } }
}
```

```json
{ "filter": { "minTotalCents": 1000, "maxTotalCents": 5000, "sort": "ASC" } }
```

## Errores: mismo contrato en los dos transportes

Todos los errores de negocio heredan de `DomainError` y llevan uno de seis códigos. `DomainErrorFilter` los traduce en la frontera según el transporte ([diagrama](diagrams/05-manejo-de-errores.html)):

| Código | HTTP en REST | Cuándo |
|---|---|---|
| `BAD_USER_INPUT` | 400 | La entrada no cumple el esquema Zod |
| `UNAUTHENTICATED` | 401 | Falta el token, es inválido o las credenciales no son correctas |
| `FORBIDDEN` | 403 | Falta el rol, o el recurso no es tuyo |
| `NOT_FOUND` | 404 | El usuario o el pedido no existen |
| `CONFLICT` | 409 | Email duplicado |
| `BUSINESS_RULE` | 422 | Se incumple un invariante: pedido sin líneas, total por encima del máximo, transición no permitida, nombre de usuario vacío |

> [!NOTE]
> GraphQL responde **HTTP 200** también con errores: el código va en `errors[].extensions.code`, y `extensions.status` repite el que daría REST.

REST (`application/problem+json`):

```json
{
  "type": "about:blank",
  "title": "Entrada no válida",
  "status": 400,
  "detail": "La entrada no es válida",
  "code": "BAD_USER_INPUT",
  "instance": "/auth/register",
  "requestId": "1fbffa0e-…",
  "errors": [{ "path": "email", "message": "Invalid email address" }]
}
```

GraphQL:

```json
{
  "errors": [{
    "message": "La entrada no es válida",
    "path": ["register"],
    "extensions": { "code": "BAD_USER_INPUT", "status": 400, "details": [{ "path": "email", "message": "Invalid email address" }] }
  }],
  "data": null
}
```

Un error de negocio real en GraphiQL, una transición desde un pedido ya enviado:

[![GraphiQL: error BUSINESS_RULE al cambiar un pedido SHIPPED a PENDING](capturas/imagenes/14-error-business-rule-variables.png)](capturas/queries-graphql.md#14-transición-no-permitida-business_rule)

---

[← Regla ESR e índices](04-esr-e-indices.md) · [Índice](../README.md#documentación) · [Operaciones GraphQL con capturas →](capturas/queries-graphql.md)
