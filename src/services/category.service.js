// Capa de datos de `categories`. Es el único lugar que consulta Sequelize;
// los controladores no conocen el ORM.
import { Category } from '../models/index.js';

// `limit` y `offset` llegan ya validados desde el controlador.
export function findAll({ limit, offset } = {}) {
  return Category.findAll({
    order: [['CategoryID', 'ASC']],
    limit,
    offset,
  });
}

export function findById(id) {
  return Category.findByPk(id);
}
