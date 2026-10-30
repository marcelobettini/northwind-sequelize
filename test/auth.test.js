import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { app } from '../src/app.js';
import { sequelize } from '../src/config/database.js';
import { User } from '../src/models/index.js';
import {
  TEST_PASSWORD,
  createTestUser,
  deleteTestUser,
  loginAs,
} from './helpers/auth.js';

let server;
let baseUrl;
let activeUser;
let inactiveUser;
let cookie;

// Prefijo único por corrida: la limpieza solo borra lo que creó este archivo.
const runId = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let registrationCounter = 0;

function postJson(path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function registration(overrides = {}) {
  registrationCounter += 1;
  const suffix = `${runId}-${registrationCounter}`;

  return {
    username: `reg-${suffix}`,
    email: `reg-${suffix}@example.com`,
    password: 'Password123',
    ...overrides,
  };
}

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  activeUser = await createTestUser();
  inactiveUser = await createTestUser({ isActive: false });
  ({ cookie } = await loginAs(baseUrl, activeUser.Username));
});

after(async () => {
  await deleteTestUser(activeUser);
  await deleteTestUser(inactiveUser);
  // Limpia solo los usuarios creados por los tests de registro de esta corrida.
  await User.unscoped().destroy({
    where: { Username: { [Op.like]: `reg-${runId}-%` } },
  });
  await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
});

test('POST /api/auth/register crea la cuenta sin iniciar sesión', async () => {
  const payload = registration();
  const response = await postJson('/api/auth/register', payload);

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.user.Username, payload.username);
  assert.equal(body.user.Email, payload.email);
  assert.equal('PasswordHash' in body.user, false);
  assert.equal(response.headers.getSetCookie().length, 0);

  const loginResponse = await postJson('/api/auth/login', {
    username: payload.username,
    password: payload.password,
  });
  assert.equal(loginResponse.status, 200);
});

test('POST /api/auth/register guarda la password hasheada', async () => {
  const payload = registration();
  const response = await postJson('/api/auth/register', payload);

  assert.equal(response.status, 201);
  const body = await response.json();
  const user = await User.unscoped().findOne({
    where: { UserID: body.user.UserID },
    attributes: ['PasswordHash', 'PasswordChangedAt'],
  });

  assert.notEqual(user.PasswordHash, payload.password);
  assert.equal(await bcrypt.compare(payload.password, user.PasswordHash), true);
  assert.ok(user.PasswordChangedAt instanceof Date);
});

test('POST /api/auth/register rechaza un username duplicado', async () => {
  const first = registration();
  assert.equal((await postJson('/api/auth/register', first)).status, 201);

  const response = await postJson(
    '/api/auth/register',
    registration({ username: first.username }),
  );

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: 'El username o email ya está en uso',
  });
});

test('POST /api/auth/register rechaza un email duplicado sin distinguir mayúsculas', async () => {
  const first = registration();
  assert.equal((await postJson('/api/auth/register', first)).status, 201);

  const response = await postJson(
    '/api/auth/register',
    registration({ email: first.email.toUpperCase() }),
  );

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: 'El username o email ya está en uso',
  });
});

test('POST /api/auth/register rechaza un email inválido', async () => {
  const response = await postJson(
    '/api/auth/register',
    registration({ email: 'no-es-un-email' }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Email inválido' });
});

test('POST /api/auth/register rechaza una password corta', async () => {
  const response = await postJson(
    '/api/auth/register',
    registration({ password: 'corta12' }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'La password debe tener al menos 8 caracteres',
  });
});

test('POST /api/auth/register rechaza una password de más de 72 bytes', async () => {
  const response = await postJson(
    '/api/auth/register',
    registration({ password: 'a'.repeat(73) }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'La password no puede superar los 72 bytes',
  });
});

test('POST /api/auth/register acepta una password de exactamente 72 bytes', async () => {
  const response = await postJson(
    '/api/auth/register',
    // 36 caracteres acentuados = 72 bytes en UTF-8.
    registration({ password: 'á'.repeat(36) }),
  );

  assert.equal(response.status, 201);
});

test('POST /api/auth/register normaliza username y email', async () => {
  const base = registration();
  const response = await postJson('/api/auth/register', {
    ...base,
    username: `  ${base.username}  `,
    email: `  ${base.email.toUpperCase()}  `,
  });

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.user.Username, base.username);
  assert.equal(body.user.Email, base.email);
});

test('POST /api/auth/register resuelve dos altas simultáneas sin 500', async () => {
  const payload = registration();
  const responses = await Promise.all([
    postJson('/api/auth/register', payload),
    postJson('/api/auth/register', payload),
  ]);
  const statuses = responses.map((response) => response.status).sort();

  assert.deepEqual(statuses, [201, 409]);
});

test('POST /api/auth/register rechaza un username inválido', async () => {
  const response = await postJson(
    '/api/auth/register',
    registration({ username: 'ab' }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error:
      'Username inválido: entre 3 y 50 caracteres, solo letras, números, punto, guion y guion bajo',
  });
});

test('POST /api/auth/register exige username, email y password', async () => {
  const response = await postJson('/api/auth/register', { username: 'usuario' });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'Username, email y password son obligatorios',
  });
});

test('POST /api/auth/login autentica y setea una cookie segura', async () => {
  const response = await postJson('/api/auth/login', {
    username: activeUser.Username,
    password: TEST_PASSWORD,
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.user.UserID, activeUser.UserID);
  assert.equal(body.user.Username, activeUser.Username);
  assert.equal(body.user.Email, activeUser.Email);
  assert.equal('PasswordHash' in body.user, false);

  const setCookie = response.headers.getSetCookie();
  assert.equal(setCookie.length, 1);
  assert.match(setCookie[0], /^access_token=/);
  assert.match(setCookie[0], /HttpOnly/i);
  assert.match(setCookie[0], /SameSite=Strict/i);
  assert.match(setCookie[0], /Path=\//i);
});

test('POST /api/auth/login rechaza una password incorrecta', async () => {
  const response = await postJson('/api/auth/login', {
    username: activeUser.Username,
    password: 'password-incorrecta',
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Credenciales inválidas' });
});

test('POST /api/auth/login rechaza un usuario inexistente', async () => {
  const response = await postJson('/api/auth/login', {
    username: 'usuario-que-no-existe',
    password: TEST_PASSWORD,
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Credenciales inválidas' });
});

test('POST /api/auth/login rechaza un usuario inactivo', async () => {
  const response = await postJson('/api/auth/login', {
    username: inactiveUser.Username,
    password: TEST_PASSWORD,
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Credenciales inválidas' });
});

test('POST /api/auth/login exige username y password', async () => {
  const response = await postJson('/api/auth/login', { username: activeUser.Username });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'Username y password son obligatorios',
  });
});

test('POST /api/auth/login rechaza JSON malformado con 400', async () => {
  const response = await postJson('/api/auth/login', '{"username":');

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'JSON inválido' });
});

test('las rutas de /api requieren autenticación', async () => {
  const response = await fetch(`${baseUrl}/api/categories`);

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'No autenticado' });
});

test('una cookie válida permite usar /api', async () => {
  const response = await fetch(`${baseUrl}/api/categories`, { headers: { cookie } });

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(await response.json()));
});

test('un token con formato inválido responde 401', async () => {
  const response = await fetch(`${baseUrl}/api/categories`, {
    headers: { cookie: 'access_token=no-es-un-jwt' },
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'No autenticado' });
});

test('un token firmado con otro secreto responde 401', async () => {
  const token = jwt.sign({ sub: '1' }, 'otro-secreto', { expiresIn: 3600 });
  const response = await fetch(`${baseUrl}/api/categories`, {
    headers: { cookie: `access_token=${token}` },
  });

  assert.equal(response.status, 401);
});

test('un token vencido responde 401', async () => {
  const token = jwt.sign({ sub: '1' }, process.env.JWT_SECRET, { expiresIn: -1 });
  const response = await fetch(`${baseUrl}/api/categories`, {
    headers: { cookie: `access_token=${token}` },
  });

  assert.equal(response.status, 401);
});

test('POST /api/auth/logout borra la cookie', async () => {
  const response = await postJson('/api/auth/logout', {});

  assert.equal(response.status, 204);
  const setCookie = response.headers.getSetCookie();
  assert.equal(setCookie.length, 1);
  assert.match(setCookie[0], /^access_token=;/);
  assert.match(setCookie[0], /Expires=Thu, 01 Jan 1970 00:00:00 GMT/i);
});
