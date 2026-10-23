// Modelo de `orderdetails`. La PK es compuesta (OrderID + ProductID) y la
// tabla además guarda datos propios del detalle (precio, cantidad, descuento).
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const OrderDetail = sequelize.define(
  'OrderDetail',
  {
    OrderID: { type: DataTypes.INTEGER, primaryKey: true },
    ProductID: { type: DataTypes.INTEGER, primaryKey: true },
    UnitPrice: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },
    Quantity: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
    Discount: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },
  },
  { tableName: 'orderdetails', timestamps: false },
);
