import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'production';
process.env.ENABLE_API_DOCS = 'true';

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

test('ENABLE_API_DOCS=true habilita la UI en producción', async () => {
  const response = await fetch(`${baseUrl}/api-docs/`);

  assert.equal(response.status, 200);
});
