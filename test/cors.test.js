// CORS para el frontend en otro origen (Vite en desarrollo).
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { sequelize } from '../src/config/database.js';
import { allowedOrigins } from '../src/middlewares/cors.js';

// Se toma el primero de la allowlist real: si mañana cambia el puerto del
// frontend, el test sigue probando el mismo origen que la aplicación.
const FRONTEND_ORIGIN = allowedOrigins[0];

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

test('un origen permitido recibe cabeceras CORS con credenciales', async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: { origin: FRONTEND_ORIGIN },
  });

  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get('access-control-allow-origin'),
    FRONTEND_ORIGIN,
  );
  assert.equal(
    response.headers.get('access-control-allow-credentials'),
    'true',
  );
});

test('el preflight de una ruta protegida responde sin sesión', async () => {
  const response = await fetch(`${baseUrl}/api/products`, {
    method: 'OPTIONS',
    headers: {
      origin: FRONTEND_ORIGIN,
      'access-control-request-method': 'GET',
    },
  });

  // 204 y no 401: el preflight se responde antes de requireAuth.
  assert.equal(response.status, 204);
  assert.equal(
    response.headers.get('access-control-allow-origin'),
    FRONTEND_ORIGIN,
  );
  assert.equal(
    response.headers.get('access-control-allow-methods'),
    'GET,HEAD,PUT,PATCH,POST,DELETE',
  );
});

test('un origen no permitido no recibe cabeceras CORS', async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: { origin: 'http://origen-no-permitido.example' },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});
