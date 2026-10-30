# Tests HTTP de productos con relaciones anidadas

## Intención

Cerrar el hueco de cobertura de `products`: hoy `test/tables.test.js` solo
verifica que el listado y el detalle responden, pero no comprueba la forma de
los objetos anidados `supplier` y `category` que agrega
`src/services/product.service.js`, ni que el detalle devuelva los mismos datos
que el listado.

## Objetivos

- Agregar `test/products.test.js` con el mismo patrón que `test/employees.test.js`.
- Verificar que `GET /api/products` devuelve `supplier` con exactamente
  `CompanyName`, `ContactName` y `Phone`, y `category` con exactamente
  `CategoryName`.
- Verificar que `GET /api/products/:id` devuelve los mismos objetos anidados
  que el listado para el mismo producto.
- Verificar que la paginación (`limit` + `offset`) sigue funcionando con los
  `include`.
- Verificar los 400 de paginación inválida y los 404 de ID inexistente o no
  canónico en las rutas de productos.

## No objetivos

- No se crean fixtures ni se escribe en la base: se usan los datos existentes
  del seed Northwind (opción B descartada por ahora).
- No se valida la respuesta contra `docs/api-spec.yml` (opción C, posterior).
- No se modifica código de producción ni la especificación OpenAPI.
- No se agregan dependencias.

## Restricciones

- Los tests requieren MySQL con el esquema Northwind cargado, igual que el
  resto de la suite.
- Se usa `node:test`, `node:assert/strict` y el helper `test/helpers/auth.js`.
- El test asume que el seed contiene al menos un producto con `SupplierID` y
  `CategoryID` no nulos (Northwind estándar los tiene todos). Si no existe, el
  test falla con un mensaje explícito.

## Enfoques considerados

- **A (elegido): test HTTP con datos existentes.** Prueba el contrato real, la
  serialización de Sequelize y las rutas, sin dependencias ni escrituras.
- **B (descartado por ahora): fixtures temporales.** Cubre el caso de FKs
  nulas de forma determinista, pero agrega setup y escritura en la base.
- **C (posterior): validación contra OpenAPI.** Detecta drift documento/API,
  pero suma una dependencia de validación.

## Cómo se implementa

1. Crear `test/products.test.js` con el mismo `before`/`after` y `authFetch`
   que `test/employees.test.js`.
2. Obtener el listado completo y elegir el primer producto con `SupplierID` y
   `CategoryID` no nulos.
3. Afirmar que `supplier` no es `null`, que sus claves son exactamente
   `CompanyName`, `ContactName`, `Phone`, y que `category` tiene exactamente
   `CategoryName`.
4. Pedir el detalle de ese producto y comparar `supplier` y `category` por
   igualdad profunda con los del listado.
5. Pedir `?limit=2&offset=1` y comparar los `ProductID` con `all.slice(1, 3)`.
6. Probar 404 con `999999` y con `1abc`, y 400 con `limit=0`, `limit=1001`,
   `limit=abc`, `offset=-1` y parámetros repetidos.

## Decisiones del builder

- Los casos 400/404 se implementan como bucles dentro de un test, siguiendo el
  estilo de `test/categories.test.js`.
- No se separan en un helper nuevo: el archivo se mantiene autocontenido.
