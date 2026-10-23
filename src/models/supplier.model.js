// Modelo de solo lectura de `suppliers`.
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Supplier = sequelize.define(
  'Supplier',
  {
    SupplierID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    CompanyName: { type: DataTypes.STRING(40), allowNull: false },
    ContactName: { type: DataTypes.STRING(30) },
    ContactTitle: { type: DataTypes.STRING(30) },
    Address: { type: DataTypes.STRING(60) },
    City: { type: DataTypes.STRING(15) },
    Region: { type: DataTypes.STRING(15) },
    PostalCode: { type: DataTypes.STRING(10) },
    Country: { type: DataTypes.STRING(15) },
    Phone: { type: DataTypes.STRING(24) },
    Fax: { type: DataTypes.STRING(24) },
    HomePage: { type: DataTypes.TEXT('long') },
  },
  { tableName: 'suppliers', timestamps: false },
);
