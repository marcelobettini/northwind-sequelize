// Traduce HTTP a llamadas del servicio; Express 5 reenvía los rechazos async.
import * as orderService from '../services/order.service.js';
import { parseIntegerId } from '../utils/params.js';
import { parsePagination } from '../utils/pagination.js';

export async function list(req, res) {
  const orders = await orderService.findAll(parsePagination(req.query));
  res.json(orders);
}

export async function getById(req, res) {
  const order = await orderService.findById(parseIntegerId(req.params.id));

  if (!order) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }

  res.json(order);
}
