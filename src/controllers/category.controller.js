// Traduce HTTP a llamadas del servicio. No hay try/catch: Express 5 reenvía
// automáticamente al error handler los rechazos de funciones async.
import * as categoryService from '../services/category.service.js';
import { parseIntegerId } from '../utils/params.js';
import { parsePagination } from '../utils/pagination.js';

export async function list(req, res) {
  const categories = await categoryService.findAll(parsePagination(req.query));
  res.json(categories);
}

export async function getById(req, res) {
  const category = await categoryService.findById(parseIntegerId(req.params.id));

  if (!category) {
    return res.status(404).json({ error: 'Categoría no encontrada' });
  }

  res.json(category);
}
