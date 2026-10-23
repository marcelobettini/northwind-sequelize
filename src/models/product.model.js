// Modelo de solo lectura de `products`.
// `Discontinued` es tinyint(1) en MySQL; Sequelize lo expone como booleano.
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Product = sequelize.define(
  'Product',
  {
    ProductID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ProductName: { type: DataTypes.STRING(40), allowNull: false },
    SupplierID: { type: DataTypes.INTEGER },
    CategoryID: { type: DataTypes.INTEGER },
    QuantityPerUnit: { type: DataTypes.STRING(20) },
    UnitPrice: { type: DataTypes.DOUBLE, defaultValue: 0 },
    UnitsInStock: { type: DataTypes.SMALLINT, defaultValue: 0 },
    UnitsOnOrder: { type: DataTypes.SMALLINT, defaultValue: 0 },
    ReorderLevel: { type: DataTypes.SMALLINT, defaultValue: 0 },
    Discontinued: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'products', timestamps: false },
);
