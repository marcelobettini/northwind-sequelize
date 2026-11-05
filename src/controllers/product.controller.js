// Traduce HTTP a llamadas del servicio; Express 5 reenvía los rechazos async.
import * as productService from '../services/product.service.js';
import { parseIntegerId } from '../utils/params.js';
import { parsePagination } from '../utils/pagination.js';

// El catálogo público devuelve como máximo 100 filas por request: reduce el
// costo de cada consulta y el volumen que puede extraer un scraper.
export const PUBLIC_MAX_LIMIT = 100;

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

export async function listPublic(req, res) {
  const products = await productService.findAllPublic(
    parsePagination(req.query, PUBLIC_MAX_LIMIT),
  );
  res.json(products);
}

export async function getByIdPublic(req, res) {
  const product = await productService.findByIdPublic(
    parseIntegerId(req.params.id),
  );

  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  res.json(product);
}
