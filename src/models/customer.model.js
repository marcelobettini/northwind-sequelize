// Modelo de solo lectura de `customers`.
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Customer = sequelize.define(
  'Customer',
  {
    CustomerID: { type: DataTypes.CHAR(5), primaryKey: true },
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
  },
  { tableName: 'customers', timestamps: false },
);
