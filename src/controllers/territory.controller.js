// Traduce HTTP a llamadas del servicio; Express 5 reenvía los rechazos async.
import * as territoryService from '../services/territory.service.js';
import { parsePagination } from '../utils/pagination.js';

export async function list(req, res) {
  const territories = await territoryService.findAll(parsePagination(req.query));
  res.json(territories);
}

export async function getById(req, res) {
  const territory = await territoryService.findById(req.params.id);

  if (!territory) {
    return res.status(404).json({ error: 'Territorio no encontrado' });
  }

  res.json(territory);
}
