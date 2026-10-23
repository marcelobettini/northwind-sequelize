// Capa de datos de `region`: único punto que consulta Sequelize.
import { Region } from '../models/index.js';

export function findAll({ limit, offset } = {}) {
  return Region.findAll({ order: [['RegionID', 'ASC']], limit, offset });
}

export function findById(id) {
  return Region.findByPk(id);
}
