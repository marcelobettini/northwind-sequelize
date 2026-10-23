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

// Tablas con una sola clave primaria. `expectRows` distingue las que tienen
// datos en esta base de las que están vacías.
const tables = [
  {
    path: '/api/customers',
    pk: 'CustomerID',
    missing: 'ZZZZZ',
    notFound: 'Cliente no encontrado',
    expectRows: true,
  },
  {
    path: '/api/customerdemographics',
    pk: 'CustomerTypeID',
    missing: 'ZZZZZZZZZZ',
    notFound: 'Demografía de cliente no encontrada',
    expectRows: false,
  },
  {
    path: '/api/employees',
    pk: 'EmployeeID',
    missing: 999999,
    notFound: 'Empleado no encontrado',
    expectRows: true,
    excluded: 'Photo',
  },
  {
    path: '/api/orders',
    pk: 'OrderID',
    missing: 999999,
    notFound: 'Pedido no encontrado',
    expectRows: true,
  },
  {
    path: '/api/products',
    pk: 'ProductID',
    missing: 999999,
    notFound: 'Producto no encontrado',
    expectRows: true,
  },
  {
    path: '/api/region',
    pk: 'RegionID',
    missing: 999999,
    notFound: 'Región no encontrada',
    expectRows: true,
  },
  {
    path: '/api/shippers',
    pk: 'ShipperID',
    missing: 999999,
    notFound: 'Transportista no encontrado',
    expectRows: true,
  },
  {
    path: '/api/suppliers',
    pk: 'SupplierID',
    missing: 999999,
    notFound: 'Proveedor no encontrado',
    expectRows: true,
  },
  {
    path: '/api/territories',
    pk: 'TerritoryID',
    missing: 'ZZZZZZZZZZZZZZZZZZZZ',
    notFound: 'Territorio no encontrado',
    expectRows: true,
  },
];

for (const table of tables) {
  test(`GET ${table.path} devuelve un array${table.excluded ? ` sin ${table.excluded}` : ''}`, async () => {
    const response = await fetch(`${baseUrl}${table.path}`);

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(Array.isArray(body));
    if (table.expectRows) {
      assert.ok(body.length > 0);
    }
    if (table.excluded) {
      for (const row of body) {
        assert.equal(table.excluded in row, false);
      }
    }
  });

  if (table.expectRows) {
    test(`GET ${table.path}/:id devuelve la fila por su PK`, async () => {
      const rows = await (await fetch(`${baseUrl}${table.path}`)).json();
      const expected = rows.at(-1);

      const response = await fetch(
        `${baseUrl}${table.path}/${encodeURIComponent(expected[table.pk])}`,
      );

      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body[table.pk], expected[table.pk]);
      if (table.excluded) {
        assert.equal(table.excluded in body, false);
      }
    });
  }

  if (Number.isInteger(table.missing)) {
    test(`GET ${table.path}/:id rechaza un ID no numérico con 404`, async () => {
      const response = await fetch(`${baseUrl}${table.path}/1abc`);

      assert.equal(response.status, 404);
      const body = await response.json();
      assert.equal(body.error, table.notFound);
    });
  }

  test(`GET ${table.path}/:id responde 404 con el mensaje del controlador`, async () => {
    const response = await fetch(`${baseUrl}${table.path}/${table.missing}`);

    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.error, table.notFound);
  });
}
