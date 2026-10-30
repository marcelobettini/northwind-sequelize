# Product Nested Relations Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add HTTP characterization tests for `GET /api/products` and `GET /api/products/:id` that pin the nested `supplier` and `category` shapes, list/detail consistency, pagination with includes, and product-route error responses.

**Architecture:** A new `test/products.test.js` mirrors `test/employees.test.js`: boot the Express app on an ephemeral port, authenticate through the existing test helper, then assert against the live Northwind seed. No production code changes, no fixtures, no new dependencies.

**Tech Stack:** Node.js 24, Express 5, Sequelize 6, MySQL, `node:test`, `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-10-30-products-tests-design.md`

## Global Constraints

- Do not modify production code, the database schema, or `docs/api-spec.yml`.
- Do not add dependencies.
- Tests require MySQL with the Northwind schema and seed data loaded, same as the rest of the suite.
- Tests are read-only: do not create, update or delete products, suppliers or categories.
- Follow the existing test style: `node:test`, `node:assert/strict`, `authFetch`, and `createTestUser`/`loginAs`/`deleteTestUser`.

## Review Focus

- **Seed without a product that has both `SupplierID` and `CategoryID`:** the happy-path test must fail with an explicit message instead of crashing on `null`.
- **Fewer than three products:** the pagination test must assert the list length before indexing `all[1]` and `all[2]`.
- **Repeated pagination parameters:** `limit=1&limit=2` must be rejected with 400, matching the existing categories behavior.
- **Non-canonical IDs:** `1abc`, `1.0` and `01` must return 404 with the product-specific message, not 400.
- **List/detail drift:** the detail endpoint must return the same nested `supplier` and `category` objects as the list; a `deepEqual` comparison must catch divergence.

---

### Task 1: Happy-path nested relations and pagination

**Files:**
- Create: `test/products.test.js`
- Test: `test/products.test.js`

**Interfaces:**
- Consumes: `app` from `src/app.js`, `sequelize` from `src/config/database.js`, `createTestUser`, `deleteTestUser`, `loginAs` from `test/helpers/auth.js`.
- Produces: `test/products.test.js` with module-level `server`, `baseUrl`, `testUser`, `cookie` and `authFetch(url, init)` used by Task 2.

- [ ] **Step 1: Write the test file with the three happy-path tests**

Create `test/products.test.js`:

```js
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { sequelize } from '../src/config/database.js';
import { createTestUser, deleteTestUser, loginAs } from './helpers/auth.js';

let server;
let baseUrl;
let testUser;
let cookie;

// Envía la cookie de sesión en cada request de la suite.
const authFetch = (url, init = {}) =>
  fetch(url, { ...init, headers: { ...init.headers, cookie } });

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  testUser = await createTestUser();
  ({ cookie } = await loginAs(baseUrl, testUser.Username));
});

after(async () => {
  await deleteTestUser(testUser);
  await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
});

test('GET /api/products incluye supplier y category anidados', async () => {
  const response = await authFetch(`${baseUrl}/api/products`);

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.length > 0);

  const product = body.find(
    (item) => item.SupplierID !== null && item.CategoryID !== null,
  );
  assert.ok(
    product,
    'se esperaba al menos un producto con proveedor y categoría',
  );

  assert.notEqual(product.supplier, null);
  assert.deepEqual(Object.keys(product.supplier).sort(), [
    'CompanyName',
    'ContactName',
    'Phone',
  ]);
  assert.notEqual(product.category, null);
  assert.deepEqual(Object.keys(product.category).sort(), ['CategoryName']);
});

test('GET /api/products/:id devuelve los mismos supplier y category que el listado', async () => {
  const list = await (await authFetch(`${baseUrl}/api/products`)).json();
  const expected = list.find(
    (item) => item.SupplierID !== null && item.CategoryID !== null,
  );
  assert.ok(
    expected,
    'se esperaba al menos un producto con proveedor y categoría',
  );

  const response = await authFetch(
    `${baseUrl}/api/products/${expected.ProductID}`,
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ProductID, expected.ProductID);
  assert.deepEqual(body.supplier, expected.supplier);
  assert.deepEqual(body.category, expected.category);
});

test('GET /api/products mantiene la paginación con los includes', async () => {
  const all = await (await authFetch(`${baseUrl}/api/products`)).json();
  assert.ok(all.length >= 3, 'se esperaban al menos 3 productos');

  const response = await authFetch(
    `${baseUrl}/api/products?limit=2&offset=1`,
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.length, 2);
  assert.equal(body[0].ProductID, all[1].ProductID);
  assert.equal(body[1].ProductID, all[2].ProductID);
});
```

- [ ] **Step 2: Run the new file**

Run: `npm test -- test/products.test.js`

Expected: all three tests PASS. These are characterization tests for existing behavior; a failure means either the seed lacks the required data or the implementation has a real defect. Investigate before continuing.

- [ ] **Step 3: Commit**

```bash
git add test/products.test.js
git commit -m "test: cover product nested supplier and category responses"
```

---

### Task 2: Product error responses

**Files:**
- Modify: `test/products.test.js` (append tests)
- Test: `test/products.test.js`

**Interfaces:**
- Consumes: the `authFetch`, `baseUrl`, `before` and `after` defined in Task 1.
- Produces: no new interfaces; the file becomes the complete product HTTP suite.

- [ ] **Step 1: Append the 404 and 400 tests**

Add at the end of `test/products.test.js`:

```js
test('GET /api/products/:id responde 404 para IDs inexistentes y no canónicos', async () => {
  for (const id of ['999999', '1abc', '1.0', '01']) {
    const response = await authFetch(`${baseUrl}/api/products/${id}`);

    assert.equal(response.status, 404, id);
    const body = await response.json();
    assert.equal(body.error, 'Producto no encontrado', id);
  }
});

test('GET /api/products rechaza paginación inválida con 400', async () => {
  for (const query of [
    'limit=0',
    'limit=1001',
    'limit=abc',
    'offset=-1',
    'limit=1&limit=2',
    'offset=99999999999999999999',
  ]) {
    const response = await authFetch(`${baseUrl}/api/products?${query}`);

    assert.equal(response.status, 400, query);
  }
});
```

- [ ] **Step 2: Run the file again**

Run: `npm test -- test/products.test.js`

Expected: all five tests PASS.

- [ ] **Step 3: Run the full suite**

Run: `npm test`

Expected: every test file passes and no suite interferes with another.

- [ ] **Step 4: Commit**

```bash
git add test/products.test.js
git commit -m "test: cover product route error responses"
```
