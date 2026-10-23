// Capa de datos de `employeeterritories`: único punto que consulta Sequelize.
import { EmployeeTerritory } from '../models/index.js';

export function findAll({ limit, offset } = {}) {
  return EmployeeTerritory.findAll({
    order: [
      ['EmployeeID', 'ASC'],
      ['TerritoryID', 'ASC'],
    ],
    limit,
    offset,
  });
}

// La PK es compuesta: findByPk no acepta objetos en Sequelize 6, así que se
// consulta con findOne y un where con las dos columnas.
export function findById({ EmployeeID, TerritoryID }) {
  return EmployeeTerritory.findOne({ where: { EmployeeID, TerritoryID } });
}
