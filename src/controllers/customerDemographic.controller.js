// Traduce HTTP a llamadas del servicio; Express 5 reenvía los rechazos async.
import * as customerDemographicService from '../services/customerDemographic.service.js';
import { parsePagination } from '../utils/pagination.js';

export async function list(req, res) {
  const demographics = await customerDemographicService.findAll(parsePagination(req.query));
  res.json(demographics);
}

export async function getById(req, res) {
  const demographic = await customerDemographicService.findById(req.params.id);

  if (!demographic) {
    return res.status(404).json({ error: 'Demografía de cliente no encontrada' });
  }

  res.json(demographic);
}
