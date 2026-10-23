// Traduce HTTP a llamadas del servicio; Express 5 reenvía los rechazos async.
import * as productService from '../services/product.service.js';
import { parseIntegerId } from '../utils/params.js';
import { parsePagination } from '../utils/pagination.js';

export async function list(req, res) {
  const products = await productService.findAll(parsePagination(req.query));
  res.json(products);
}

export async function getById(req, res) {
  const product = await productService.findById(parseIntegerId(req.params.id));

  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  res.json(product);
}
