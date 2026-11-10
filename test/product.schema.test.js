import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProductSchema } from '../src/schemas/product.schema.js';

// Payload mínimo válido: el resto de las columnas tienen default o son nullable.
const parse = (overrides = {}) =>
  createProductSchema.safeParse({ ProductName: 'Producto', ...overrides });

test('acepta solo ProductName y deja los defaults a la base', () => {
  const result = parse();

  assert.equal(result.success, true);
  assert.deepEqual(result.data, { ProductName: 'Producto' });
});

test('rechaza ProductID porque lo genera la base', () => {
  const result = parse({ ProductID: 5000 });

  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /Unrecognized key/i);
});

test('rechaza campos desconocidos', () => {
  const result = parse({ foo: 'bar' });

  assert.equal(result.success, false);
});

test('exige ProductName no vacío y lo recorta antes de medir', () => {
  assert.equal(parse({ ProductName: '   ' }).success, false);
  assert.equal(parse({ ProductName: '  Producto  ' }).data.ProductName, 'Producto');
  assert.equal(parse({ ProductName: 'a'.repeat(40) }).success, true);
  assert.equal(parse({ ProductName: 'a'.repeat(41) }).success, false);
});

test('acepta null en las columnas nullable del modelo', () => {
  const result = parse({
    SupplierID: null,
    CategoryID: null,
    QuantityPerUnit: null,
    UnitPrice: null,
    UnitsInStock: null,
    UnitsOnOrder: null,
    ReorderLevel: null,
  });

  assert.equal(result.success, true);
});

test('exige IDs enteros positivos dentro del rango INT de MySQL', () => {
  assert.equal(parse({ SupplierID: 1, CategoryID: 1 }).success, true);
  assert.equal(parse({ SupplierID: 2147483647 }).success, true);
  assert.equal(parse({ SupplierID: 2147483648 }).success, false);
  assert.equal(parse({ CategoryID: 2147483648 }).success, false);
  assert.equal(parse({ SupplierID: 0 }).success, false);
  assert.equal(parse({ SupplierID: -1 }).success, false);
  assert.equal(parse({ SupplierID: 1.5 }).success, false);
  assert.equal(parse({ SupplierID: '1' }).success, false);
});

test('acepta UnitPrice no negativo y rechaza Infinity', () => {
  assert.equal(parse({ UnitPrice: 0 }).success, true);
  assert.equal(parse({ UnitPrice: 12.5 }).success, true);
  assert.equal(parse({ UnitPrice: -0.01 }).success, false);
  assert.equal(parse({ UnitPrice: Infinity }).success, false);
});

test('rechaza valores negativos en stock, pedidos y reorden', () => {
  for (const field of ['UnitsInStock', 'UnitsOnOrder', 'ReorderLevel']) {
    assert.equal(parse({ [field]: 0 }).success, true, field);
    assert.equal(parse({ [field]: 32767 }).success, true, field);
    assert.equal(parse({ [field]: -1 }).success, false, field);
    assert.equal(parse({ [field]: -32768 }).success, false, field);
    assert.equal(parse({ [field]: 32768 }).success, false, field);
    assert.equal(parse({ [field]: 1.5 }).success, false, field);
  }
});

test('QuantityPerUnit respeta VARCHAR(20) después de recortar', () => {
  assert.equal(parse({ QuantityPerUnit: '  caja  ' }).data.QuantityPerUnit, 'caja');
  assert.equal(parse({ QuantityPerUnit: 'a'.repeat(20) }).success, true);
  assert.equal(parse({ QuantityPerUnit: 'a'.repeat(21) }).success, false);
});

test('Discontinued es booleano, opcional y no acepta null', () => {
  assert.equal(parse().data.Discontinued, undefined);
  assert.equal(parse({ Discontinued: true }).data.Discontinued, true);
  assert.equal(parse({ Discontinued: false }).data.Discontinued, false);
  assert.equal(parse({ Discontinued: null }).success, false);
  assert.equal(parse({ Discontinued: 'false' }).success, false);
  assert.equal(parse({ Discontinued: 0 }).success, false);
});
