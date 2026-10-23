// Traduce HTTP a llamadas del servicio; Express 5 reenvía los rechazos async.
import * as customerService from '../services/customer.service.js';
import { parsePagination } from '../utils/pagination.js';

export async function list(req, res) {
  const customers = await customerService.findAll(parsePagination(req.query));
  res.json(customers);
}

export async function getById(req, res) {
  const customer = await customerService.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  res.json(customer);
}
