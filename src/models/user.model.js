// Modelo de `users`. `PasswordHash` queda fuera del defaultScope para que no
// se filtre en consultas normales; el login lo pide con `User.unscoped()`.
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const User = sequelize.define(
  'User',
  {
    UserID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    Username: { type: DataTypes.STRING(50), allowNull: false },
    Email: { type: DataTypes.STRING(255), allowNull: false },
    PasswordHash: { type: DataTypes.STRING(60), allowNull: false },
    PasswordChangedAt: { type: DataTypes.DATE },
    IsActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    IsAdmin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: 'users',
    timestamps: false,
    defaultScope: { attributes: { exclude: ['PasswordHash', 'IsAdmin'] } },
  },
);
