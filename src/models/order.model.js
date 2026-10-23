// Modelo de solo lectura de `orders`.
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Order = sequelize.define(
  'Order',
  {
    OrderID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    CustomerID: { type: DataTypes.CHAR(5) },
    EmployeeID: { type: DataTypes.INTEGER },
    OrderDate: { type: DataTypes.DATE },
    RequiredDate: { type: DataTypes.DATE },
    ShippedDate: { type: DataTypes.DATE },
    ShipVia: { type: DataTypes.INTEGER },
    Freight: { type: DataTypes.DOUBLE, defaultValue: 0 },
    ShipName: { type: DataTypes.STRING(40) },
    ShipAddress: { type: DataTypes.STRING(60) },
    ShipCity: { type: DataTypes.STRING(15) },
    ShipRegion: { type: DataTypes.STRING(15) },
    ShipPostalCode: { type: DataTypes.STRING(10) },
    ShipCountry: { type: DataTypes.STRING(15) },
  },
  { tableName: 'orders', timestamps: false },
);
