// Conexión única a MySQL. Sequelize reutiliza este pool en toda la aplicación.
// Las credenciales se cargan desde .env y nunca se registran en consola.
import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
  },
);
