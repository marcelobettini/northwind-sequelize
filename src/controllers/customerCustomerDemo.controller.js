// Traduce HTTP a llamadas del servicio; Express 5 reenvía los rechazos async.
// La PK es compuesta, así que la ruta aporta dos parámetros.
import * as customerCustomerDemoService from '../services/customerCustomerDemo.service.js';
import { parsePagination } from '../utils/pagination.js';

export async function list(req, res) {
  const relations = await customerCustomerDemoService.findAll(parsePagination(req.query));
  res.json(relations);
}

export async function getById(req, res) {
  const relation = await customerCustomerDemoService.findById({
    CustomerID: req.params.customerId,
    CustomerTypeID: req.params.customerTypeId,
  });

  if (!relation) {
    return res.status(404).json({ error: 'Relación cliente-demografía no encontrada' });
  }

  res.json(relation);
}
