import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { sequelize } from '../src/config/database.js';
import { User } from '../src/models/index.js';
import { createTestUser, deleteTestUser, loginAs } from './helpers/auth.js';

let server;
let baseUrl;
let testUser;
let regularUser;
let cookie;
let regularCookie;

// Envía la cookie de sesión en cada request de la suite.
const authFetch = (url, init = {}) =>
  fetch(url, { ...init, headers: { ...init.headers, cookie } });

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  testUser = await createTestUser({ isAdmin: true });
  ({ cookie } = await loginAs(baseUrl, testUser.Username));

  regularUser = await createTestUser();
  ({ cookie: regularCookie } = await loginAs(baseUrl, regularUser.Username));
});

after(async () => {
  await deleteTestUser(testUser);
  await deleteTestUser(regularUser);
  await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
});

test('GET /api/employees incluye ReportsTo y el jefe anidado', async () => {
  const response = await authFetch(`${baseUrl}/api/employees`);

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
  const body = await (await authFetch(`${baseUrl}/api/employees`)).json();

  const topBoss = body.find((employee) => employee.ReportsTo === null);
  assert.ok(topBoss, 'se esperaba al menos un empleado sin jefe');

  assert.equal(topBoss.manager, null);
});

test('GET /api/employees/:id incluye el jefe anidado', async () => {
  const list = await (await authFetch(`${baseUrl}/api/employees`)).json();
  const subordinate = list.find((employee) => employee.ReportsTo !== null);

  const response = await authFetch(`${baseUrl}/api/employees/${subordinate.EmployeeID}`);

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ReportsTo, subordinate.ReportsTo);
  assert.equal(body.manager.EmployeeID, subordinate.ReportsTo);
  assert.ok(body.manager.FirstName);
  assert.ok(body.manager.LastName);
});

test('GET /api/employees mantiene la paginación con el include', async () => {
  const all = await (await authFetch(`${baseUrl}/api/employees`)).json();

  const response = await authFetch(`${baseUrl}/api/employees?limit=2&offset=1`);

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.length, 2);
  assert.equal(body[0].EmployeeID, all[1].EmployeeID);
  assert.equal(body[1].EmployeeID, all[2].EmployeeID);
});

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

test('un admin degradado después del login recibe 403', async () => {
  const user = await createTestUser({ isAdmin: true });
  const { cookie: userCookie } = await loginAs(baseUrl, user.Username);

  await User.unscoped().update(
    { IsAdmin: false },
    { where: { UserID: user.UserID } },
  );

  const response = await fetch(`${baseUrl}/api/employees`, {
    headers: { cookie: userCookie },
  });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: 'Acceso denegado' });

  await deleteTestUser(user);
});
