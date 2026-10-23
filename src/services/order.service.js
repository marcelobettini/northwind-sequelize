// Capa de datos de `orders`: único punto que consulta Sequelize.
import { Order } from '../models/index.js';

export function findAll({ limit, offset } = {}) {
  return Order.findAll({ order: [['OrderID', 'ASC']], limit, offset });
}

export function findById(id) {
  return Order.findByPk(id);
}
