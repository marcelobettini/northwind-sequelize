// Tabla de unión `employeeterritories` con PK compuesta.
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const EmployeeTerritory = sequelize.define(
  'EmployeeTerritory',
  {
    EmployeeID: { type: DataTypes.INTEGER, primaryKey: true },
    TerritoryID: { type: DataTypes.STRING(20), primaryKey: true },
  },
  { tableName: 'employeeterritories', timestamps: false },
);
