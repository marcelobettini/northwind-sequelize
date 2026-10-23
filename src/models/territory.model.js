// Modelo de solo lectura de `territories`.
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Territory = sequelize.define(
  'Territory',
  {
    TerritoryID: { type: DataTypes.STRING(20), primaryKey: true },
    TerritoryDescription: { type: DataTypes.CHAR(50), allowNull: false },
    RegionID: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: 'territories', timestamps: false },
);
