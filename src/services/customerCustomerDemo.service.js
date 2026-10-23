// Capa de datos de `customercustomerdemo`: único punto que consulta Sequelize.
import { CustomerCustomerDemo } from '../models/index.js';

export function findAll({ limit, offset } = {}) {
  return CustomerCustomerDemo.findAll({
    order: [
      ['CustomerID', 'ASC'],
      ['CustomerTypeID', 'ASC'],
    ],
    limit,
    offset,
  });
}

// La PK es compuesta: findByPk no acepta objetos en Sequelize 6, así que se
// consulta con findOne y un where con las dos columnas.
export function findById({ CustomerID, CustomerTypeID }) {
  return CustomerCustomerDemo.findOne({ where: { CustomerID, CustomerTypeID } });
}
