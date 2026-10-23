// Capa de datos de `suppliers`: único punto que consulta Sequelize.
import { Supplier } from '../models/index.js';

export function findAll({ limit, offset } = {}) {
  return Supplier.findAll({ order: [['SupplierID', 'ASC']], limit, offset });
}

export function findById(id) {
  return Supplier.findByPk(id);
}
