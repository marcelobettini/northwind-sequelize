// Traduce HTTP a llamadas del servicio; Express 5 reenvía los rechazos async.
import * as regionService from '../services/region.service.js';
import { parseIntegerId } from '../utils/params.js';
import { parsePagination } from '../utils/pagination.js';

export async function list(req, res) {
  const regions = await regionService.findAll(parsePagination(req.query));
  res.json(regions);
}

export async function getById(req, res) {
  const region = await regionService.findById(parseIntegerId(req.params.id));

  if (!region) {
    return res.status(404).json({ error: 'Región no encontrada' });
  }

  res.json(region);
}
