# Empleados con datos de su jefe — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que `GET /api/employees` y `GET /api/employees/:id` devuelvan `manager` con `EmployeeID`, `FirstName` y `LastName` del jefe indicado por `ReportsTo`.

**Architecture:** Se reutiliza la asociación autorreferente `manager` ya declarada en `src/models/index.js`. El único cambio de producción es agregar un `include` acotado por `attributes` en las dos consultas de `src/services/employee.service.js`.

**Tech Stack:** Node.js 24, Express 5, Sequelize 6, MySQL, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-23-employees-manager-design.md`

## Global Constraints

- No modificar el esquema SQL ni las asociaciones existentes.
- No agregar dependencias.
- `ReportsTo` sigue siendo un entero en la respuesta.
- `manager` solo expone `EmployeeID`, `FirstName` y `LastName`; nunca `Photo`.
- El proyecto no es un repositorio git: no hay pasos de commit.
- Los tests requieren MySQL con el esquema Northwind cargado (`.env`).

## Review Focus

- Empleado con `ReportsTo = NULL`: debe devolver `manager: null`, no omitir la clave ni fallar.
- Paginación (`limit`/`offset`) combinada con el `include`: debe seguir devolviendo la cantidad y el orden correctos.
- El `include` no debe filtrar `Photo` desde la tabla relacionada.

---

### Task 1: Incluir el jefe en las respuestas de empleados

**Files:**
- Modify: `src/services/employee.service.js`
- Test: `test/employees.test.js` (crear)

**Interfaces:**
- Consumes: `Employee` exportado desde `src/models/index.js` y la asociación `Employee.associations.manager`.
- Produces: `findAll({ limit, offset })` y `findById(id)` devuelven instancias de `Employee` que, al serializarse, incluyen `manager: { EmployeeID, FirstName, LastName } | null`.

- [ ] **Step 1: Escribir el test que falla**

Crear `test/employees.test.js` con el mismo arranque que `test/categories.test.js` (`before` levanta `app` en puerto 0, `after` cierra servidor y `sequelize`) y estos tests:

```js
test('GET /api/employees incluye ReportsTo y el jefe anidado', async () => {
  const response = await fetch(`${baseUrl}/api/employees`);

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.length > 0);

  const subordinate = body.find((employee) => employee.ReportsTo !== null);
  assert.ok(subordinate, 'se esperaba al menos un empleado con jefe');

  assert.equal(subordinate.manager.EmployeeID, subordinate.ReportsTo);
  assert.ok(subordinate.manager.FirstName);
  assert.ok(subordinate.manager.LastName);
  assert.deepEqual(Object.keys(subordinate.manager).sort(), [
    'EmployeeID',
    'FirstName',
    'LastName',
  ]);
  assert.equal('Photo' in subordinate.manager, false);
});

test('GET /api/employees devuelve manager null para quien no tiene jefe', async () => {
  const body = await (await fetch(`${baseUrl}/api/employees`)).json();

  const topBoss = body.find((employee) => employee.ReportsTo === null);
  assert.ok(topBoss, 'se esperaba al menos un empleado sin jefe');

  assert.equal(topBoss.manager, null);
});

test('GET /api/employees/:id incluye el jefe anidado', async () => {
  const list = await (await fetch(`${baseUrl}/api/employees`)).json();
  const subordinate = list.find((employee) => employee.ReportsTo !== null);

  const response = await fetch(`${baseUrl}/api/employees/${subordinate.EmployeeID}`);

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ReportsTo, subordinate.ReportsTo);
  assert.equal(body.manager.EmployeeID, subordinate.ReportsTo);
  assert.ok(body.manager.FirstName);
  assert.ok(body.manager.LastName);
});

test('GET /api/employees mantiene la paginación con el include', async () => {
  const all = await (await fetch(`${baseUrl}/api/employees`)).json();

  const response = await fetch(`${baseUrl}/api/employees?limit=2&offset=1`);

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.length, 2);
  assert.equal(body[0].EmployeeID, all[1].EmployeeID);
  assert.equal(body[1].EmployeeID, all[2].EmployeeID);
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `node --env-file-if-exists=.env --test test/employees.test.js`
Expected: FAIL; `subordinate.manager` es `undefined` (o `TypeError` al leer `EmployeeID`).

- [ ] **Step 3: Implementar el `include` en el servicio**

En `src/services/employee.service.js`, importar también `Employee` ya está disponible y agregar en ambas consultas:

```js
include: [
  {
    model: Employee,
    as: 'manager',
    attributes: ['EmployeeID', 'FirstName', 'LastName'],
  },
],
```

`findAll` conserva `order: [['EmployeeID', 'ASC']]`, `limit` y `offset`; `findById` sigue siendo `Employee.findByPk(id, { include })`.

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `node --env-file-if-exists=.env --test test/employees.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Ejecutar la suite completa**

Run: `npm test`
Expected: PASS, sin regresiones en `tables.test.js`, `models.test.js`, `errors.test.js`, `composite-keys.test.js` y `categories.test.js`.
