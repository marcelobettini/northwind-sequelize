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

test('GET /openapi.yaml responde el contrato sin autenticación', async () => {
  const response = await fetch(`${baseUrl}/openapi.yaml`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /yaml/);
  assert.match(await response.text(), /^openapi:/);
});
