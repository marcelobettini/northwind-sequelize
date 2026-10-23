import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Category,
  Customer,
  CustomerDemographic,
  CustomerCustomerDemo,
  Employee,
  EmployeeTerritory,
  Order,
  OrderDetail,
  Product,
  Region,
  Shipper,
  Supplier,
  Territory,
} from '../src/models/index.js';

// Cada asociación debe apuntar a la columna declarada como FK en el esquema.
const expectedForeignKeys = [
  [Product, 'category', 'CategoryID'],
  [Product, 'supplier', 'SupplierID'],
  [Category, 'products', 'CategoryID'],
  [Supplier, 'products', 'SupplierID'],
  [Order, 'customer', 'CustomerID'],
  [Order, 'employee', 'EmployeeID'],
  [Order, 'shipper', 'ShipVia'],
  [Customer, 'orders', 'CustomerID'],
  [Employee, 'orders', 'EmployeeID'],
  [Shipper, 'orders', 'ShipVia'],
  [Order, 'details', 'OrderID'],
  [OrderDetail, 'order', 'OrderID'],
  [OrderDetail, 'product', 'ProductID'],
  [Product, 'orderDetails', 'ProductID'],
  [Employee, 'manager', 'ReportsTo'],
  [Employee, 'reports', 'ReportsTo'],
  [Territory, 'region', 'RegionID'],
  [Region, 'territories', 'RegionID'],
  [CustomerCustomerDemo, 'customer', 'CustomerID'],
  [CustomerCustomerDemo, 'demographic', 'CustomerTypeID'],
  [Customer, 'customerCustomerDemos', 'CustomerID'],
  [CustomerDemographic, 'customerCustomerDemos', 'CustomerTypeID'],
  [EmployeeTerritory, 'employee', 'EmployeeID'],
  [EmployeeTerritory, 'territory', 'TerritoryID'],
  [Employee, 'employeeTerritories', 'EmployeeID'],
  [Territory, 'employeeTerritories', 'TerritoryID'],
];

test('las asociaciones apuntan a las claves foráneas del esquema', () => {
  for (const [model, alias, foreignKey] of expectedForeignKeys) {
    const association = model.associations[alias];

    assert.ok(association, `${model.name}.${alias} no existe`);
    assert.equal(association.foreignKey, foreignKey, `${model.name}.${alias}`);
  }
});

test('las claves primarias y defaults críticos coinciden con el esquema', () => {
  assert.equal(Category.rawAttributes.CategoryID.primaryKey, true);
  assert.equal(Category.rawAttributes.CategoryID.autoIncrement, true);
  assert.equal(Region.rawAttributes.RegionID.primaryKey, true);
  assert.ok(!Region.rawAttributes.RegionID.autoIncrement);

  assert.equal(OrderDetail.rawAttributes.OrderID.primaryKey, true);
  assert.equal(OrderDetail.rawAttributes.ProductID.primaryKey, true);
  assert.equal(EmployeeTerritory.rawAttributes.EmployeeID.primaryKey, true);
  assert.equal(EmployeeTerritory.rawAttributes.TerritoryID.primaryKey, true);
  assert.equal(CustomerCustomerDemo.rawAttributes.CustomerID.primaryKey, true);
  assert.equal(CustomerCustomerDemo.rawAttributes.CustomerTypeID.primaryKey, true);

  assert.equal(Product.rawAttributes.Discontinued.allowNull, false);
  assert.equal(Product.rawAttributes.Discontinued.defaultValue, false);
  assert.equal(OrderDetail.rawAttributes.Quantity.allowNull, false);
  assert.equal(OrderDetail.rawAttributes.Quantity.defaultValue, 0);
});
