import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'production';
delete process.env.ENABLE_API_DOCS;

const { app } = await import('../src/app.js');
const { sequelize } = await import('../src/config/database.js');

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

test('sin ENABLE_API_DOCS, /api-docs no existe en producción', async () => {
  const response = await fetch(`${baseUrl}/api-docs/`);

  assert.equal(response.status, 404);
});

test('/openapi.yaml sigue disponible en producción', async () => {
  const response = await fetch(`${baseUrl}/openapi.yaml`);

  assert.equal(response.status, 200);
});
