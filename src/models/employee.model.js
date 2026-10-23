// Modelo de solo lectura de `employees`.
// `Photo` (LONGBLOB) se excluye del defaultScope por la misma razón que
// `categories.Picture`: no se expone ni se escribe desde la API.
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Employee = sequelize.define(
  'Employee',
  {
    EmployeeID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    LastName: { type: DataTypes.STRING(20), allowNull: false },
    FirstName: { type: DataTypes.STRING(10), allowNull: false },
    Title: { type: DataTypes.STRING(30) },
    TitleOfCourtesy: { type: DataTypes.STRING(25) },
    BirthDate: { type: DataTypes.DATE },
    HireDate: { type: DataTypes.DATE },
    Address: { type: DataTypes.STRING(60) },
    City: { type: DataTypes.STRING(15) },
    Region: { type: DataTypes.STRING(15) },
    PostalCode: { type: DataTypes.STRING(10) },
    Country: { type: DataTypes.STRING(15) },
    HomePhone: { type: DataTypes.STRING(24) },
    Extension: { type: DataTypes.STRING(4) },
    Photo: { type: DataTypes.BLOB('long') },
    Notes: { type: DataTypes.TEXT('long') },
    ReportsTo: { type: DataTypes.INTEGER },
    PhotoPath: { type: DataTypes.STRING(255) },
  },
  {
    tableName: 'employees',
    timestamps: false,
    defaultScope: { attributes: { exclude: ['Photo'] } },
  },
);
