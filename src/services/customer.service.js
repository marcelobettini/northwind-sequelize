// Capa de datos de `customers`: único punto que consulta Sequelize.
import { Customer } from '../models/index.js';

export function findAll({ limit, offset } = {}) {
  return Customer.findAll({ order: [['CustomerID', 'ASC']], limit, offset });
}

export function findById(id) {
  return Customer.findByPk(id);
}
