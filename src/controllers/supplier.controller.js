// Traduce HTTP a llamadas del servicio; Express 5 reenvía los rechazos async.
import * as supplierService from '../services/supplier.service.js';
import { parseIntegerId } from '../utils/params.js';
import { parsePagination } from '../utils/pagination.js';

export async function list(req, res) {
  const suppliers = await supplierService.findAll(parsePagination(req.query));
  res.json(suppliers);
}

export async function getById(req, res) {
  const supplier = await supplierService.findById(parseIntegerId(req.params.id));

  if (!supplier) {
    return res.status(404).json({ error: 'Proveedor no encontrado' });
  }

  res.json(supplier);
}
