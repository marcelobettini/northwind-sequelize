// Modelo de solo lectura de `region`.
// Su PK no es autoincremental en el esquema, así que no lleva autoIncrement.
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Region = sequelize.define(
  'Region',
  {
    RegionID: { type: DataTypes.INTEGER, primaryKey: true },
    RegionDescription: { type: DataTypes.CHAR(50), allowNull: false },
  },
  { tableName: 'region', timestamps: false },
);
