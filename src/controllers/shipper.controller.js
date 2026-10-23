// Traduce HTTP a llamadas del servicio; Express 5 reenvía los rechazos async.
import * as shipperService from '../services/shipper.service.js';
import { parseIntegerId } from '../utils/params.js';
import { parsePagination } from '../utils/pagination.js';

export async function list(req, res) {
  const shippers = await shipperService.findAll(parsePagination(req.query));
  res.json(shippers);
}

export async function getById(req, res) {
  const shipper = await shipperService.findById(parseIntegerId(req.params.id));

  if (!shipper) {
    return res.status(404).json({ error: 'Transportista no encontrado' });
  }

  res.json(shipper);
}
