// Capa de datos de `shippers`: único punto que consulta Sequelize.
import { Shipper } from '../models/index.js';

export function findAll({ limit, offset } = {}) {
  return Shipper.findAll({ order: [['ShipperID', 'ASC']], limit, offset });
}

export function findById(id) {
  return Shipper.findByPk(id);
}
