// Modelo de solo lectura de `customerdemographics`.
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const CustomerDemographic = sequelize.define(
  'CustomerDemographic',
  {
    CustomerTypeID: { type: DataTypes.CHAR(10), primaryKey: true },
    CustomerDesc: { type: DataTypes.TEXT('long') },
  },
  { tableName: 'customerdemographics', timestamps: false },
);
