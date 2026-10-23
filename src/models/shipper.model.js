// Modelo de solo lectura de `shippers`.
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Shipper = sequelize.define(
  'Shipper',
  {
    ShipperID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    CompanyName: { type: DataTypes.STRING(40), allowNull: false },
    Phone: { type: DataTypes.STRING(24) },
  },
  { tableName: 'shippers', timestamps: false },
);
