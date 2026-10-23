// Capa de datos de `territories`: único punto que consulta Sequelize.
import { Territory } from '../models/index.js';

export function findAll({ limit, offset } = {}) {
  return Territory.findAll({ order: [['TerritoryID', 'ASC']], limit, offset });
}

export function findById(id) {
  return Territory.findByPk(id);
}
