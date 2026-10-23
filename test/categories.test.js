import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { sequelize } from '../src/config/database.js';

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
});

test('GET /api/categories devuelve la lista sin el blob Picture', async () => {
  const response = await fetch(`${baseUrl}/api/categories`);

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(Array.isArray(body));
  assert.ok(body.length > 0);
  assert.ok('CategoryID' in body[0]);
  assert.ok('CategoryName' in body[0]);
  assert.equal('Picture' in body[0], false);
});

test('GET /api/categories/:id devuelve una categoría por su PK', async () => {
  const list = await (await fetch(`${baseUrl}/api/categories`)).json();
  const expected = list.at(-1);

  const response = await fetch(`${baseUrl}/api/categories/${expected.CategoryID}`);

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.CategoryID, expected.CategoryID);
  assert.equal(body.CategoryName, expected.CategoryName);
  assert.equal('Picture' in body, false);
});

test('GET /api/categories/:id responde 404 propio si la categoría no existe', async () => {
  const response = await fetch(`${baseUrl}/api/categories/999999`);

  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.error, 'Categoría no encontrada');
});

test('GET /api/categories aplica limit y offset', async () => {
  const all = await (await fetch(`${baseUrl}/api/categories`)).json();

  const response = await fetch(`${baseUrl}/api/categories?limit=2&offset=1`);

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.length, 2);
  assert.equal(body[0].CategoryID, all[1].CategoryID);
  assert.equal(body[1].CategoryID, all[2].CategoryID);
});

test('GET /api/categories rechaza paginación inválida con 400', async () => {
  for (const query of [
    'limit=0',
    'limit=1001',
    'limit=abc',
    'offset=-1',
    'limit=1&limit=2',
    'offset=99999999999999999999',
  ]) {
    const response = await fetch(`${baseUrl}/api/categories?${query}`);
    assert.equal(response.status, 400, query);
  }
});

test('GET /api/categories rechaza IDs no numéricos con 404', async () => {
  for (const id of ['1abc', '1.0', '01']) {
    const response = await fetch(`${baseUrl}/api/categories/${id}`);

    assert.equal(response.status, 404, id);
    const body = await response.json();
    assert.equal(body.error, 'Categoría no encontrada', id);
  }
});

test('GET /api/categories aplica offset sin limit', async () => {
  const all = await (await fetch(`${baseUrl}/api/categories`)).json();

  const response = await fetch(`${baseUrl}/api/categories?offset=${all.length - 2}`);

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.length, 2);
  assert.equal(body[0].CategoryID, all[all.length - 2].CategoryID);
});
