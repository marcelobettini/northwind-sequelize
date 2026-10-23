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

test('GET /api/customercustomerdemo devuelve un array', async () => {
  const response = await fetch(`${baseUrl}/api/customercustomerdemo`);

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(await response.json()));
});

test('GET /api/customercustomerdemo responde 404 propio con una PK compuesta inexistente', async () => {
  const response = await fetch(`${baseUrl}/api/customercustomerdemo/ZZZZZ/ZZZZZZZZZZ`);

  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.error, 'Relación cliente-demografía no encontrada');
});

test('GET /api/employeeterritories devuelve la relación por su PK compuesta', async () => {
  const rows = await (await fetch(`${baseUrl}/api/employeeterritories`)).json();
  assert.ok(rows.length > 0);
  const expected = rows.at(-1);

  const response = await fetch(
    `${baseUrl}/api/employeeterritories/${expected.EmployeeID}/${encodeURIComponent(expected.TerritoryID)}`,
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.EmployeeID, expected.EmployeeID);
  assert.equal(body.TerritoryID, expected.TerritoryID);
});

test('GET /api/employeeterritories responde 404 propio con una PK compuesta inexistente', async () => {
  const response = await fetch(`${baseUrl}/api/employeeterritories/999999/ZZZZZZZZZZZZZZZZZZZZ`);

  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.error, 'Relación empleado-territorio no encontrada');
});

test('GET /api/employeeterritories rechaza un EmployeeID no numérico con 404', async () => {
  const rows = await (await fetch(`${baseUrl}/api/employeeterritories`)).json();
  const expected = rows.at(-1);

  const response = await fetch(
    `${baseUrl}/api/employeeterritories/${expected.EmployeeID}x/${encodeURIComponent(expected.TerritoryID)}`,
  );

  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.error, 'Relación empleado-territorio no encontrada');
});

test('GET /api/orderdetails devuelve el detalle por su PK compuesta', async () => {
  const rows = await (await fetch(`${baseUrl}/api/orderdetails`)).json();
  assert.ok(rows.length > 0);
  const expected = rows.at(-1);

  const response = await fetch(
    `${baseUrl}/api/orderdetails/${expected.OrderID}/${expected.ProductID}`,
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.OrderID, expected.OrderID);
  assert.equal(body.ProductID, expected.ProductID);
});

test('GET /api/orderdetails rechaza un OrderID no numérico con 404', async () => {
  const rows = await (await fetch(`${baseUrl}/api/orderdetails`)).json();
  const expected = rows.at(-1);

  const response = await fetch(
    `${baseUrl}/api/orderdetails/${expected.OrderID}x/${expected.ProductID}`,
  );

  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.error, 'Detalle de pedido no encontrado');
});

test('GET /api/orderdetails responde 404 propio con una PK compuesta inexistente', async () => {
  const response = await fetch(`${baseUrl}/api/orderdetails/999999/999999`);

  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.error, 'Detalle de pedido no encontrado');
});
