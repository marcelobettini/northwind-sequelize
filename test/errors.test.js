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

test('una ruta desconocida responde 404 en JSON', async () => {
  const response = await authFetch(`${baseUrl}/api/no-existe`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Ruta no encontrada' });
});
