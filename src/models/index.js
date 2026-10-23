// Registro central de modelos y asociaciones.
// Las asociaciones se declaran aquí (no en cada modelo) para que el grafo
// completo quede en un solo lugar. Reflejan exactamente las claves foráneas
// del esquema; no se usa belongsToMany porque las tablas de unión ya exponen
// sus propias relaciones.
import { Category } from './category.model.js';
import { Customer } from './customer.model.js';
import { CustomerDemographic } from './customerDemographic.model.js';
import { CustomerCustomerDemo } from './customerCustomerDemo.model.js';
import { Employee } from './employee.model.js';
import { EmployeeTerritory } from './employeeTerritory.model.js';
import { Order } from './order.model.js';
import { OrderDetail } from './orderDetail.model.js';
import { Product } from './product.model.js';
import { Region } from './region.model.js';
import { Shipper } from './shipper.model.js';
import { Supplier } from './supplier.model.js';
import { Territory } from './territory.model.js';

export {
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
};

// products → categories / suppliers
Category.hasMany(Product, { foreignKey: 'CategoryID', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'CategoryID', as: 'category' });

Supplier.hasMany(Product, { foreignKey: 'SupplierID', as: 'products' });
Product.belongsTo(Supplier, { foreignKey: 'SupplierID', as: 'supplier' });

// orders → customers / employees / shippers
Customer.hasMany(Order, { foreignKey: 'CustomerID', as: 'orders' });
Order.belongsTo(Customer, { foreignKey: 'CustomerID', as: 'customer' });

Employee.hasMany(Order, { foreignKey: 'EmployeeID', as: 'orders' });
Order.belongsTo(Employee, { foreignKey: 'EmployeeID', as: 'employee' });

Shipper.hasMany(Order, { foreignKey: 'ShipVia', as: 'orders' });
Order.belongsTo(Shipper, { foreignKey: 'ShipVia', as: 'shipper' });

// orderdetails → orders / products
Order.hasMany(OrderDetail, { foreignKey: 'OrderID', as: 'details' });
OrderDetail.belongsTo(Order, { foreignKey: 'OrderID', as: 'order' });

Product.hasMany(OrderDetail, { foreignKey: 'ProductID', as: 'orderDetails' });
OrderDetail.belongsTo(Product, { foreignKey: 'ProductID', as: 'product' });

// employees se referencia a sí misma mediante ReportsTo
Employee.belongsTo(Employee, { foreignKey: 'ReportsTo', as: 'manager' });
Employee.hasMany(Employee, { foreignKey: 'ReportsTo', as: 'reports' });

// territories → region
Region.hasMany(Territory, { foreignKey: 'RegionID', as: 'territories' });
Territory.belongsTo(Region, { foreignKey: 'RegionID', as: 'region' });

// customercustomerdemo → customers / customerdemographics
Customer.hasMany(CustomerCustomerDemo, {
  foreignKey: 'CustomerID',
  as: 'customerCustomerDemos',
});
CustomerCustomerDemo.belongsTo(Customer, { foreignKey: 'CustomerID', as: 'customer' });

CustomerDemographic.hasMany(CustomerCustomerDemo, {
  foreignKey: 'CustomerTypeID',
  as: 'customerCustomerDemos',
});
CustomerCustomerDemo.belongsTo(CustomerDemographic, {
  foreignKey: 'CustomerTypeID',
  as: 'demographic',
});

// employeeterritories → employees / territories
Employee.hasMany(EmployeeTerritory, {
  foreignKey: 'EmployeeID',
  as: 'employeeTerritories',
});
EmployeeTerritory.belongsTo(Employee, { foreignKey: 'EmployeeID', as: 'employee' });

Territory.hasMany(EmployeeTerritory, {
  foreignKey: 'TerritoryID',
  as: 'employeeTerritories',
});
EmployeeTerritory.belongsTo(Territory, { foreignKey: 'TerritoryID', as: 'territory' });
