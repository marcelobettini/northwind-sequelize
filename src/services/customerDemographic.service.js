// Capa de datos de `customerdemographics`: único punto que consulta Sequelize.
import { CustomerDemographic } from '../models/index.js';

export function findAll({ limit, offset } = {}) {
  return CustomerDemographic.findAll({ order: [['CustomerTypeID', 'ASC']], limit, offset });
}

export function findById(id) {
  return CustomerDemographic.findByPk(id);
}
