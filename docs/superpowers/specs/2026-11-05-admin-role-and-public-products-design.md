# Rol de administrador y catálogo público

## Intención

Los usuarios de `users` representan empleados. Cualquier usuario autenticado
puede operar sobre el resto de la API; solo las operaciones marcadas como
administrativas requieren `IsAdmin`. Por ahora la única operación
administrativa es leer los legajos de empleados (`/api/employees`). El catálogo
de productos es público en una vista reducida y mantiene la vista completa para
usuarios logueados.

`IsAdmin` se asigna manualmente en la base. La API nunca lo escribe y no lo
expone en las respuestas de autenticación.

## Decisiones

- **Esquema:** `IsAdmin tinyint NOT NULL DEFAULT '0'` después de `IsActive` en
  `db-schema/northwind.sql`. Ya está aplicado en las bases de desarrollo y test.
- **Modelo:** `IsAdmin` booleano, `allowNull: false`, `defaultValue: false`.
  `defaultScope` excluye `PasswordHash` e `IsAdmin`.
- **Asignación manual:** `UPDATE users SET IsAdmin = 1 WHERE Username = '...';`
  No hay endpoint de gestión de usuarios.
- **`requireAuth`** adjunta `req.auth = { userId }` a partir del `sub` del JWT.
  Un `sub` no entero se rechaza con 401.
- **`requireAdmin`** consulta la base en cada request administrativa
  (`UserID`, `IsAdmin`, `IsActive`): 401 si el usuario no existe o está
  inactivo; 403 si existe pero no es admin. No se usa un claim en el JWT para
  que una degradación tenga efecto inmediato.
- **Empleados:** `/api/employees` y `/api/employees/:id` requieren admin. Se
  aplica a nivel de router, para que cualquier ruta futura herede la
  restricción: `apiRouter.use('/employees', requireAdmin, employeeRouter)`.
- **Productos:** dos contratos explícitos.
  - `GET /api/public/products` y `GET /api/public/products/:id`: públicos, sin
    sesión. Proyección reducida.
  - `GET /api/products` y `GET /api/products/:id`: requieren sesión; sin
    cambios (todos los escalares + `supplier` + `category`).
- **Registro:** sigue tomando solo `username`, `email` y `password`; `isAdmin`
  en el body se ignora. Regresión cubierta por test.
- **Sin `optionalAuth`:** la misma URL no cambia de forma según la cookie.

## Proyección pública de producto

| Campo | Público |
|---|---|
| `ProductID`, `ProductName` | sí |
| `QuantityPerUnit`, `UnitPrice` | sí |
| `category: { CategoryName }` | sí |
| `UnitsInStock` | no |
| `Discontinued` | no |
| `SupplierID`, `CategoryID` | no |
| `UnitsOnOrder`, `ReorderLevel` | no |
| `supplier` | no |

## Endpoints

| Endpoint | Acceso | Respuesta |
|---|---|---|
| `GET /api/public/products` | Público | `200` con proyección reducida |
| `GET /api/public/products/:id` | Público | `200` reducida / `404` |
| `GET /api/products` | Sesión | `200` completa / `401` |
| `GET /api/products/:id` | Sesión | `200` completa / `401` / `404` |
| `GET /api/employees` | Admin | `200` / `401` / `403` |
| `GET /api/employees/:id` | Admin | `200` / `401` / `403` / `404` |
| Resto de `/api/*` | Sesión | sin cambios |

## Alternativas consideradas

- **`optionalAuth` en la misma URL:** descartado; el cuerpo cambia según la
  cookie, lo que complica documentación, tests y caching.
- **`/api/products` público + `/api/account/products` completo:** descartado;
  cambia el contrato y la URL del endpoint actual sin ser más simple.

## Archivos

- `db-schema/northwind.sql` — columna `IsAdmin`.
- `src/models/user.model.js` — atributo y `defaultScope` (ya modificado en el
  working tree).
- `src/middlewares/auth.js` — `requireAuth` y `requireAdmin`.
- `src/routes/index.js` — `requireAdmin` en `/employees`.
- `src/services/product.service.js` — proyección pública.
- `src/controllers/product.controller.js` — handlers públicos.
- `src/routes/product.routes.js` — `publicProductRouter`.
- `src/app.js` — montaje de `/api/public/products`.
- `test/helpers/auth.js`, `test/employees.test.js`, `test/tables.test.js`,
  `test/models.test.js`, `test/auth.test.js`, `test/products.test.js`.
- `docs/api-spec.yml` — contrato actualizado.

## Fuera de alcance

Rate limit específico para productos públicos, empleados anidados en
`/api/orders`, `/api/employeeterritories`, gestión de usuarios por API,
`IsAdmin` como claim del JWT y un endpoint `/api/auth/me`.
