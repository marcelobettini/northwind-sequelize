// Capa de datos de `products`: único punto que consulta Sequelize.
import { Category, Product, Supplier } from '../models/index.js';

function getSupplierInclude() {
  return {
    model: Supplier,
    as: 'supplier',
    attributes: ['CompanyName', 'ContactName', 'Phone'],
  };
}

function getCategoryInclude() {
  return {
    model: Category,
    as: 'category',
    attributes: ['CategoryName'],
  };
}

export function findAll({ limit, offset } = {}) {
  return Product.findAll({
    include: [getSupplierInclude(), getCategoryInclude()],
    order: [['ProductID', 'ASC']],
    limit,
    offset,
  });
}

export function findById(id) {
  return Product.findByPk(id, {
    include: [getSupplierInclude(), getCategoryInclude()],
  });
}
