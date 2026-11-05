# Admin Role and Public Product View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `IsAdmin` flag assigned manually in the database, restrict `/api/employees` to admins, and expose a reduced public product catalog at `/api/public/products` while keeping the existing authenticated product endpoints unchanged.

**Architecture:** `users.IsAdmin` is read from the database by a new `requireAdmin` middleware, never trusted from the client or frozen into the JWT. The existing `requireAuth` attaches the user ID decoded from the token. Products get a second, explicit public router with its own reduced projection instead of a response shape that varies by cookie.

**Tech Stack:** Node.js 24, Express 5, Sequelize 6, MySQL, `node:test`, `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-11-05-admin-role-and-public-products-design.md`

## Global Constraints

- Do not add dependencies.
- Do not change the response contract of `GET /api/products` and `GET /api/products/:id`.
- `IsAdmin` is never accepted from a request body, never returned by auth responses, and never included in the JWT.
- `IsAdmin` is excluded from `User`'s `defaultScope`; read it with `User.unscoped()`.
- Error messages stay in Spanish and match the existing style: `No autenticado` for 401 and `Acceso denegado` for 403.
- The database schema source of truth is `db-schema/northwind.sql`; the development and test databases already have `IsAdmin tinyint NOT NULL DEFAULT '0'`.
- Tests run against the live Northwind seed and create/delete their own users.
- Run the full suite with `npm test` before claiming a task is done.

## Review Focus

- **Privilege escalation on registration:** posting `isAdmin: true` to `/api/auth/register` must create a non-admin user and must not echo the field.
- **Employee detail bypass:** a non-admin must receive 403 from both `/api/employees` and `/api/employees/:id`, not just the list.
- **Stale admin tokens:** a user who is deactivated after login must receive 401 from admin routes because `requireAdmin` re-reads `IsActive`.
- **Public product leakage:** every object returned by `/api/public/products` must expose exactly `ProductID`, `ProductName`, `QuantityPerUnit`, `UnitPrice` and `category`; no supplier, stock, order or reorder fields.
- **Protected product drift:** `/api/products` must still return 401 without a cookie and the full shape with one.

---

### Task 1: Lock `IsAdmin` in the schema and model

The working tree already contains the `User` model change; this task completes the SQL schema and pins the behavior with tests.

**Files:**
- Modify: `db-schema/northwind.sql:313-325`
- Modify: `src/models/user.model.js:15`
- Test: `test/models.test.js:59-67`
- Test: `test/auth.test.js` (append after the registration tests)

**Interfaces:**
- Produces: `User.rawAttributes.IsAdmin` with `allowNull === false` and `defaultValue === false`; `User.options.defaultScope.attributes.exclude` equal to `['PasswordHash', 'IsAdmin']`.
- Produces: registration ignores an `isAdmin`/`IsAdmin` body field.

- [ ] **Step 1: Add the column to the SQL schema**

In `db-schema/northwind.sql`, inside `CREATE TABLE \`users\``, insert after the `IsActive` line:

```sql
  `IsAdmin` tinyint NOT NULL DEFAULT '0',
```

- [ ] **Step 2: Normalize the model declaration**

In `src/models/user.model.js`, keep the existing `IsAdmin` attribute and add the missing trailing comma after it so the file matches the project style:

```js
    IsAdmin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
```

- [ ] **Step 3: Update the model test**

Replace the last assertion of the `el modelo User coincide con la tabla users` test in `test/models.test.js` and add the `IsAdmin` assertions:

```js
  assert.equal(User.rawAttributes.IsAdmin.allowNull, false);
  assert.equal(User.rawAttributes.IsAdmin.defaultValue, false);
  assert.deepEqual(User.options.defaultScope.attributes.exclude, [
    'PasswordHash',
    'IsAdmin',
  ]);
```

- [ ] **Step 4: Add the registration regression test**

Append to `test/auth.test.js`:

```js
test('POST /api/auth/register ignora isAdmin enviado en el body', async () => {
  const payload = { ...registration(), isAdmin: true };
  const response = await postJson('/api/auth/register', payload);

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal('IsAdmin' in body.user, false);

  const user = await User.unscoped().findOne({
    where: { UserID: body.user.UserID },
    attributes: ['IsAdmin'],
  });
  assert.equal(user.IsAdmin, false);
});
```

- [ ] **Step 5: Run the affected tests**

Run: `npm test -- test/models.test.js test/auth.test.js`
Expected: PASS. The model assertions and the registration test should pass; the registration whitelist already ignores unknown fields.

- [ ] **Step 6: Commit**

```bash
git add db-schema/northwind.sql src/models/user.model.js test/models.test.js test/auth.test.js
git commit -m "feat: document IsAdmin column and pin registration behavior"
```

---

### Task 2: Restrict employee endpoints to admins

**Files:**
- Modify: `src/middlewares/auth.js`
- Modify: `src/routes/index.js:23`
- Modify: `test/helpers/auth.js:9-20`
- Modify: `test/employees.test.js`
- Modify: `test/tables.test.js:21`
- Test: `test/auth.test.js`

**Interfaces:**
- Consumes: `verifyToken(token)` from `src/services/auth.service.js`.
- Consumes: `User` from `src/models/index.js`.
- Produces: `requireAuth(req, res, next)` sets `req.auth = { userId: number }` or responds 401.
- Produces: `requireAdmin(req, res, next)` responds 401 when the user is missing/inactive, 403 when `IsAdmin` is false, otherwise calls `next()`.
- Produces: `createTestUser({ isActive = true, isAdmin = false } = {})`.

- [ ] **Step 1: Extend the test helper**

In `test/helpers/auth.js`, change the signature and the create call:

```js
export async function createTestUser({ isActive = true, isAdmin = false } = {}) {
```

```js
    IsActive: isActive,
    IsAdmin: isAdmin,
```

- [ ] **Step 2: Write the failing access tests**

In `test/employees.test.js`, import `User`:

```js
import { User } from '../src/models/index.js';
```

Declare the new module-level variables:

```js
let testUser;
let regularUser;
let cookie;
let regularCookie;
```

Create a non-admin user in `before`, and clean it up in `after`:

```js
  testUser = await createTestUser({ isAdmin: true });
  ({ cookie } = await loginAs(baseUrl, testUser.Username));

  regularUser = await createTestUser();
  ({ cookie: regularCookie } = await loginAs(baseUrl, regularUser.Username));
```

```js
  await deleteTestUser(regularUser);
```

Append these tests:

```js
test('GET /api/employees responde 403 a un usuario sin rol admin', async () => {
  const response = await fetch(`${baseUrl}/api/employees`, {
    headers: { cookie: regularCookie },
  });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: 'Acceso denegado' });
});

test('GET /api/employees/:id responde 403 a un usuario sin rol admin', async () => {
  const response = await fetch(`${baseUrl}/api/employees/1`, {
    headers: { cookie: regularCookie },
  });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: 'Acceso denegado' });
});

test('GET /api/employees responde 401 sin sesión', async () => {
  const response = await fetch(`${baseUrl}/api/employees`);

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'No autenticado' });
});

test('un admin desactivado después del login recibe 401', async () => {
  const user = await createTestUser({ isAdmin: true });
  const { cookie: userCookie } = await loginAs(baseUrl, user.Username);

  await User.unscoped().update(
    { IsActive: false },
    { where: { UserID: user.UserID } },
  );

  const response = await fetch(`${baseUrl}/api/employees`, {
    headers: { cookie: userCookie },
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'No autenticado' });

  await deleteTestUser(user);
});
```

In `test/tables.test.js`, the suite reads `/api/employees`, so its user must be an admin:

```js
  testUser = await createTestUser({ isAdmin: true });
```

Add the non-numeric `sub` test to `test/auth.test.js`:

```js
test('un token con sub no numérico responde 401', async () => {
  const token = jwt.sign({ sub: 'abc' }, process.env.JWT_SECRET, {
    expiresIn: 3600,
  });
  const response = await fetch(`${baseUrl}/api/categories`, {
    headers: { cookie: `access_token=${token}` },
  });

  assert.equal(response.status, 401);
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- test/employees.test.js test/auth.test.js`
Expected: FAIL. The non-admin requests currently return 200, and the non-numeric `sub` currently passes `requireAuth`.

- [ ] **Step 4: Implement `requireAuth` and `requireAdmin`**

Replace the contents of `src/middlewares/auth.js` with:

```js
// Exige una cookie con un JWT válido. No consulta la base: el token firmado
// alcanza para saber que la sesión existió y no venció.
import { SESSION_COOKIE_NAME } from '../config/auth.js';
import { verifyToken } from '../services/auth.service.js';
import { User } from '../models/index.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  const payload = token ? verifyToken(token) : null;
  const userId = Number(payload?.sub);

  if (!payload || !Number.isInteger(userId)) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  req.auth = { userId };
  next();
}

// Las operaciones administrativas sí consultan la base: una degradación o
// desactivación debe tener efecto inmediato, sin esperar a que venza el token.
export async function requireAdmin(req, res, next) {
  const user = await User.unscoped().findOne({
    where: { UserID: req.auth.userId },
    attributes: ['UserID', 'IsAdmin', 'IsActive'],
  });

  if (!user || !user.IsActive) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  if (!user.IsAdmin) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  next();
}
```

- [ ] **Step 5: Apply the restriction at the router level**

In `src/routes/index.js`, import `requireAdmin` and replace the employees mount:

```js
import { requireAdmin } from '../middlewares/auth.js';
```

```js
apiRouter.use('/employees', requireAdmin, employeeRouter);
```

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/middlewares/auth.js src/routes/index.js test/helpers/auth.js test/employees.test.js test/tables.test.js test/auth.test.js
git commit -m "feat: restrict employee records to admins"
```

---

### Task 3: Add the public product catalog

**Files:**
- Modify: `src/services/product.service.js`
- Modify: `src/controllers/product.controller.js`
- Modify: `src/routes/product.routes.js`
- Modify: `src/app.js:42-43`
- Test: `test/products.test.js`

**Interfaces:**
- Produces: `findAllPublic({ limit, offset } = {})` and `findByIdPublic(id)` in `src/services/product.service.js`.
- Produces: `listPublic(req, res)` and `getByIdPublic(req, res)` in `src/controllers/product.controller.js`.
- Produces: `publicProductRouter` exported from `src/routes/product.routes.js`, mounted at `/api/public/products`.

- [ ] **Step 1: Write the failing public catalog tests**

Append to `test/products.test.js`:

```js
const PUBLIC_PRODUCT_KEYS = [
  'ProductID',
  'ProductName',
  'QuantityPerUnit',
  'UnitPrice',
  'category',
].sort();

test('GET /api/public/products no requiere sesión y usa la proyección reducida', async () => {
  const response = await fetch(`${baseUrl}/api/public/products`);

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.length > 0);

  for (const product of body) {
    assert.deepEqual(Object.keys(product).sort(), PUBLIC_PRODUCT_KEYS);
    assert.equal('supplier' in product, false);
    assert.equal('UnitsInStock' in product, false);
    assert.equal('Discontinued' in product, false);
  }

  assert.ok(body.some((product) => product.category !== null));
});

test('GET /api/public/products/:id devuelve la proyección reducida', async () => {
  const list = await (await fetch(`${baseUrl}/api/public/products`)).json();
  const expected = list.find((product) => product.category !== null);
  assert.ok(expected, 'se esperaba al menos un producto con categoría');

  const response = await fetch(
    `${baseUrl}/api/public/products/${expected.ProductID}`,
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(Object.keys(body).sort(), PUBLIC_PRODUCT_KEYS);
  assert.deepEqual(body.category, expected.category);
});

test('GET /api/public/products/:id responde 404 para IDs no canónicos', async () => {
  for (const id of ['999999', '1abc', '1.0', '01']) {
    const response = await fetch(`${baseUrl}/api/public/products/${id}`);

    assert.equal(response.status, 404, id);
    assert.deepEqual(await response.json(), {
      error: 'Producto no encontrado',
    });
  }
});

test('GET /api/public/products rechaza paginación inválida con 400', async () => {
  const response = await fetch(`${baseUrl}/api/public/products?limit=0`);

  assert.equal(response.status, 400);
});

test('GET /api/products sigue requiriendo sesión', async () => {
  const response = await fetch(`${baseUrl}/api/products`);

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'No autenticado' });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- test/products.test.js`
Expected: FAIL. `/api/public/products` currently falls through to the protected `/api` block and returns 401.

- [ ] **Step 3: Add the public queries to the product service**

Replace the contents of `src/services/product.service.js` with:

```js
// Capa de datos de `products`: único punto que consulta Sequelize.
import { Category, Product, Supplier } from '../models/index.js';

const PUBLIC_PRODUCT_ATTRIBUTES = [
  'ProductID',
  'ProductName',
  'QuantityPerUnit',
  'UnitPrice',
];

function getCategoryInclude() {
  return {
    model: Category,
    as: 'category',
    attributes: ['CategoryName'],
  };
}

function getSupplierInclude() {
  return {
    model: Supplier,
    as: 'supplier',
    attributes: ['CompanyName', 'ContactName', 'Phone'],
  };
}

export function findAll({ limit, offset } = {}) {
  return Product.findAll({
    include: [getSupplierInclude(), getCategoryInclude()],
    order: [['ProductID', 'ASC']],
    limit,
    offset,
  });
}

export function findById(id) {
  return Product.findByPk(id, {
    include: [getSupplierInclude(), getCategoryInclude()],
  });
}

export function findAllPublic({ limit, offset } = {}) {
  return Product.findAll({
    attributes: PUBLIC_PRODUCT_ATTRIBUTES,
    include: [getCategoryInclude()],
    order: [['ProductID', 'ASC']],
    limit,
    offset,
  });
}

export function findByIdPublic(id) {
  return Product.findByPk(id, {
    attributes: PUBLIC_PRODUCT_ATTRIBUTES,
    include: [getCategoryInclude()],
  });
}
```

- [ ] **Step 4: Add the public handlers**

Append to `src/controllers/product.controller.js`:

```js
export async function listPublic(req, res) {
  const products = await productService.findAllPublic(parsePagination(req.query));
  res.json(products);
}

export async function getByIdPublic(req, res) {
  const product = await productService.findByIdPublic(
    parseIntegerId(req.params.id),
  );

  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  res.json(product);
}
```

- [ ] **Step 5: Export the public router**

In `src/routes/product.routes.js`, add after the existing routes:

```js
export const publicProductRouter = Router();

publicProductRouter.get('/', productController.listPublic);
publicProductRouter.get('/:id', productController.getByIdPublic);
```

- [ ] **Step 6: Mount the public router before the protected block**

In `src/app.js`, import the router and mount it between `/api/auth` and the protected `/api` block:

```js
import { publicProductRouter } from './routes/product.routes.js';
```

```js
app.use('/api/auth', authRouter);
app.use('/api/public/products', publicProductRouter);
app.use('/api', requireAuth, apiRouter);
```

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS. Existing authenticated product tests must keep passing unchanged.

- [ ] **Step 8: Commit**

```bash
git add src/services/product.service.js src/controllers/product.controller.js src/routes/product.routes.js src/app.js test/products.test.js
git commit -m "feat: add public product catalog"
```

---

### Task 4: Update the OpenAPI contract

**Files:**
- Modify: `docs/api-spec.yml`

**Interfaces:**
- Consumes: the implemented routes from Tasks 2 and 3.
- Produces: documented `/api/public/products`, `/api/public/products/{id}`, the `PublicProduct` schema, the `Forbidden` response, and the 403 responses on employee operations.

- [ ] **Step 1: Update the general description and the security scheme note**

In `info.description`, state that the auth endpoints and the public product catalog are public and every other `/api` operation requires a session cookie. In `components.securitySchemes.cookieAuth.description`, keep the statement that `requireAuth` verifies signature and expiry without querying the database, and add that admin-only operations also verify the current `IsAdmin` and `IsActive` values in the database.

- [ ] **Step 2: Add the `Forbidden` response component**

Under `components.responses`, add:

```yaml
    Forbidden:
      description: The session is valid but the user does not have the admin role.
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: Acceso denegado
```

- [ ] **Step 3: Document 403 on employee operations**

Add `'403': $ref: '#/components/responses/Forbidden'` to both `GET /api/employees` and `GET /api/employees/{id}` responses.

- [ ] **Step 4: Add the public product paths**

Add `/api/public/products` and `/api/public/products/{id}` with `security: []`, the shared `Limit`/`Offset`/`ResourceId` parameters, the existing `BadPagination`, `InternalServerError` and product-not-found behavior, and `200` responses referencing a new `PublicProduct` schema.

- [ ] **Step 5: Add the `PublicProduct` schema**

Under `components.schemas`, add a schema with exactly these properties: `ProductID`, `ProductName`, `QuantityPerUnit`, `UnitPrice` and `category` (nullable `CategoryRef`). Do not add `supplier`, `SupplierID`, `CategoryID`, `UnitsInStock`, `UnitsOnOrder`, `ReorderLevel` or `Discontinued`.

- [ ] **Step 6: Validate the YAML and compare paths with the code**

Run: `python -c "import yaml; d = yaml.safe_load(open('docs/api-spec.yml', encoding='utf-8')); print(sorted(d['paths']))"`
Expected: the output lists every implemented path, including `/api/public/products` and `/api/public/products/{id}`.

No OpenAPI linter is installed in the project; note that limitation instead of installing one.

- [ ] **Step 7: Commit**

```bash
git add docs/api-spec.yml
git commit -m "docs: document admin-only employees and public product catalog"
```
