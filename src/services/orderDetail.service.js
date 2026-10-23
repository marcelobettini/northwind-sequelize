// Capa de datos de `orderdetails`: único punto que consulta Sequelize.
import { OrderDetail } from '../models/index.js';

export function findAll({ limit, offset } = {}) {
  return OrderDetail.findAll({
    order: [
      ['OrderID', 'ASC'],
      ['ProductID', 'ASC'],
    ],
    limit,
    offset,
  });
}

// La PK es compuesta: findByPk no acepta objetos en Sequelize 6, así que se
// consulta con findOne y un where con las dos columnas.
export function findById({ OrderID, ProductID }) {
  return OrderDetail.findOne({ where: { OrderID, ProductID } });
}
