// Traduce HTTP a llamadas del servicio; Express 5 reenvía los rechazos async.
// La PK es compuesta, así que la ruta aporta dos parámetros.
import * as employeeTerritoryService from '../services/employeeTerritory.service.js';
import { parseIntegerId } from '../utils/params.js';
import { parsePagination } from '../utils/pagination.js';

export async function list(req, res) {
  const relations = await employeeTerritoryService.findAll(parsePagination(req.query));
  res.json(relations);
}

export async function getById(req, res) {
  const employeeId = parseIntegerId(req.params.employeeId);

  const relation =
    employeeId === null
      ? null
      : await employeeTerritoryService.findById({
          EmployeeID: employeeId,
          TerritoryID: req.params.territoryId,
        });

  if (!relation) {
    return res.status(404).json({ error: 'Relación empleado-territorio no encontrada' });
  }

  res.json(relation);
}
