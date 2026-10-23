// Traduce HTTP a llamadas del servicio; Express 5 reenvía los rechazos async.
// La PK es compuesta, así que la ruta aporta dos parámetros.
import * as orderDetailService from '../services/orderDetail.service.js';
import { parseIntegerId } from '../utils/params.js';
import { parsePagination } from '../utils/pagination.js';

export async function list(req, res) {
  const details = await orderDetailService.findAll(parsePagination(req.query));
  res.json(details);
}

export async function getById(req, res) {
  const orderId = parseIntegerId(req.params.orderId);
  const productId = parseIntegerId(req.params.productId);

  const detail =
    orderId === null || productId === null
      ? null
      : await orderDetailService.findById({ OrderID: orderId, ProductID: productId });

  if (!detail) {
    return res.status(404).json({ error: 'Detalle de pedido no encontrado' });
  }

  res.json(detail);
}
