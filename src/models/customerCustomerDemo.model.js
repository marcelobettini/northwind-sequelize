// Tabla de unión `customercustomerdemo`. Su PK es compuesta, por eso ambas
// columnas llevan primaryKey y el modelo no tiene `id` propio.
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const CustomerCustomerDemo = sequelize.define(
  'CustomerCustomerDemo',
  {
    CustomerID: { type: DataTypes.CHAR(5), primaryKey: true },
    CustomerTypeID: { type: DataTypes.CHAR(10), primaryKey: true },
  },
  { tableName: 'customercustomerdemo', timestamps: false },
);
