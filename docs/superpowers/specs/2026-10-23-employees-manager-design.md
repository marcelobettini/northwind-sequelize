# Empleados con datos de su jefe (`ReportsTo`)

## Intención

`GET /api/employees` y `GET /api/employees/:id` deben devolver, junto con cada
empleado, el `FirstName` y `LastName` de su jefe según `ReportsTo`
(autorreferencia a la tabla `employees`), sin obligar al cliente a una segunda
petición.

## Decisiones

- `ReportsTo` se conserva como entero (FK), igual que el resto de las FKs de la API.
- Se agrega un objeto anidado `manager` con `EmployeeID`, `FirstName` y `LastName`.
- Aplica tanto al listado como al detalle.
- Si `ReportsTo` es `NULL` (el empleado no tiene jefe), `manager` es `null`.
- No se incluyen otros campos del jefe ni `Photo`.
- Sin cambios de esquema y sin nuevas asociaciones: la asociación
  `Employee.belongsTo(Employee, { foreignKey: 'ReportsTo', as: 'manager' })`
  ya existe en `src/models/index.js`.
- La convención de anidar relaciones queda acotada a `Employees` por ahora;
  extenderla a otras tablas es una decisión posterior.

## Alternativas consideradas

- **A (elegida): FK escalar + objeto `manager` anidado.** Reutiliza la asociación
  existente, mantiene la simetría con el resto de la API (todas las FKs son
  escalares) y no pisa el atributo `ReportsTo`.
- **B (descartada): `ReportsTo` como objeto.** Más compacta, pero requiere
  renombrar el alias de la asociación a `ReportsTo`, pisar el atributo escalar y
  convierte a `Employees` en la única tabla cuya FK no es un escalar.

La compatibilidad con clientes existentes no fue un factor: el proyecto es
greenfield y la app no se ha usado todavía.

## Cómo se implementa

En `src/services/employee.service.js`, agregar a `findAll` y `findById`:

```js
include: [
  {
    model: Employee,
    as: 'manager',
    attributes: ['EmployeeID', 'FirstName', 'LastName'],
  },
],
```

Sin cambios en controlador, rutas, modelos ni base de datos.

## Verificación

- Nuevo test HTTP `test/employees.test.js` que compruebe:
  - el listado incluye `ReportsTo` y `manager` con `EmployeeID`, `FirstName` y `LastName`;
  - el detalle devuelve la misma forma;
  - el empleado sin jefe devuelve `manager: null`;
  - `Photo` no aparece;
  - la paginación sigue funcionando junto con el `include`.
- `npm test` (requiere MySQL con el esquema Northwind cargado).

## Fuera de alcance

- Filtrar qué campos se muestran al usuario mediante query params (paso posterior
  mencionado por el usuario).
- Anidar relaciones en otras tablas.
