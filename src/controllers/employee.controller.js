// Traduce HTTP a llamadas del servicio; Express 5 reenvía los rechazos async.
import * as employeeService from '../services/employee.service.js';
import { parseIntegerId } from '../utils/params.js';
import { parsePagination } from '../utils/pagination.js';

export async function list(req, res) {
  const employees = await employeeService.findAll(parsePagination(req.query));
  res.json(employees);
}

export async function getById(req, res) {
  const employee = await employeeService.findById(parseIntegerId(req.params.id));

  if (!employee) {
    return res.status(404).json({ error: 'Empleado no encontrado' });
  }

  res.json(employee);
}
