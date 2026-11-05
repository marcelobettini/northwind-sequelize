// Límite de peticiones sobre los endpoints públicos de autenticación:
// 10 intentos fallidos de login por 15 minutos y 30 registros por hora, por IP.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { sequelize } from '../src/config/database.js';
import {
  loginLimiter,
  publicProductsLimiter,
} from '../src/middlewares/rateLimit.js';
import { TEST_PASSWORD, createTestUser, deleteTestUser } from './helpers/auth.js';

// Las pruebas se conectan desde 127.0.0.1; ese es el cliente que cuenta el
// store en memoria.
const CLIENT_IP = '127.0.0.1';

let server;
let baseUrl;
let testUser;

function postJson(path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  testUser = await createTestUser();
});

after(async () => {
  await deleteTestUser(testUser);
  await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
});

test('el login bloquea con 429 después de 10 intentos fallidos', async () => {
  const attempts = [];

  for (let i = 0; i < 10; i += 1) {
    attempts.push(
      await postJson('/api/auth/login', {
        username: testUser.Username,
        password: 'password-incorrecta',
      }),
    );
  }

  assert.deepEqual(
    attempts.map((response) => response.status),
    Array(10).fill(401),
  );

  // La petición 11 se corta en el limiter, antes de validar credenciales:
  // incluso con la password correcta responde 429.
  const blocked = await postJson('/api/auth/login', {
    username: testUser.Username,
    password: TEST_PASSWORD,
  });

  assert.equal(blocked.status, 429);
  assert.deepEqual(await blocked.json(), {
    error: 'Demasiados intentos de login. Probá de nuevo más tarde.',
  });
  assert.match(blocked.headers.get('ratelimit-policy'), /^"login"; q=10; w=900/);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
});

test('un login exitoso no consume cuota', async () => {
  await loginLimiter.resetKey(CLIENT_IP);

  // Más inicios de sesión que el límite: si contaran, el 11.º daría 429.
  for (let i = 0; i < 11; i += 1) {
    const response = await postJson('/api/auth/login', {
      username: testUser.Username,
      password: TEST_PASSWORD,
    });

    assert.equal(response.status, 200);
  }
});

test('el registro bloquea con 429 después de 30 intentos', async () => {
  const attempts = [];

  // Payload inválido: el limiter corre antes de la validación, así que cada
  // intento responde 400 sin gastar tiempo en bcrypt.
  for (let i = 0; i < 30; i += 1) {
    attempts.push(await postJson('/api/auth/register', {}));
  }

  assert.deepEqual(
    attempts.map((response) => response.status),
    Array(30).fill(400),
  );

  const blocked = await postJson('/api/auth/register', {});

  assert.equal(blocked.status, 429);
  assert.deepEqual(await blocked.json(), {
    error: 'Demasiados registros desde esta IP. Probá más tarde.',
  });
  assert.match(blocked.headers.get('ratelimit-policy'), /^"register"; q=30; w=3600/);
});

test('el catálogo público bloquea con 429 después de 120 requests por minuto', async () => {
  await publicProductsLimiter.resetKey(CLIENT_IP);

  // `limit=1` mantiene liviana cada consulta: lo que se prueba es la cuota,
  // no el tamaño de la respuesta.
  const attempts = [];
  for (let i = 0; i < 120; i += 1) {
    attempts.push(await fetch(`${baseUrl}/api/public/products?limit=1`));
  }

  assert.deepEqual(
    attempts.map((response) => response.status),
    Array(120).fill(200),
  );

  const blocked = await fetch(`${baseUrl}/api/public/products?limit=1`);

  assert.equal(blocked.status, 429);
  assert.deepEqual(await blocked.json(), {
    error: 'Demasiadas solicitudes al catálogo. Probá de nuevo más tarde.',
  });
  assert.match(
    blocked.headers.get('ratelimit-policy'),
    /^"public-products"; q=120; w=60/,
  );
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
});
