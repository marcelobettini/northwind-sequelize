// Modelo de solo lectura de `categories`.
// `Picture` (LONGBLOB) queda fuera del defaultScope: la API no devuelve blobs
// y el campo se mantiene NULL porque ningún endpoint lo escribe.
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Category = sequelize.define(
  'Category',
  {
    CategoryID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    CategoryName: { type: DataTypes.STRING(15), allowNull: false },
    Description: { type: DataTypes.TEXT('long') },
    Picture: { type: DataTypes.BLOB('long') },
  },
  {
    tableName: 'categories',
    timestamps: false,
    defaultScope: { attributes: { exclude: ['Picture'] } },
  },
);
