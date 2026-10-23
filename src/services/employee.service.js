// Capa de datos de `employees`: único punto que consulta Sequelize.
import { Employee } from '../models/index.js';

// Solo los datos del jefe que se exponen; la FK `ReportsTo` sigue siendo un entero.
function getManagerInclude() {
  return {
    model: Employee,
    as: 'manager',
    attributes: ['EmployeeID', 'FirstName', 'LastName'],
  };
}

export function findAll({ limit, offset } = {}) {
  return Employee.findAll({
    include: [getManagerInclude()],
    order: [['EmployeeID', 'ASC']],
    limit,
    offset,
  });
}

export function findById(id) {
  return Employee.findByPk(id, { include: [getManagerInclude()] });
}
