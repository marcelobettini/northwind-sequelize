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
