// Capa de datos de `products`: único punto que consulta Sequelize.
import { Category, Product, Supplier } from '../models/index.js';

const PUBLIC_PRODUCT_ATTRIBUTES = [
  'ProductID',
  'ProductName',
  'QuantityPerUnit',
  'UnitPrice',
];

function getCategoryInclude() {
  return {
    model: Category,
    as: 'category',
    attributes: ['CategoryName'],
  };
}

function getSupplierInclude() {
  return {
    model: Supplier,
    as: 'supplier',
    attributes: ['CompanyName', 'ContactName', 'Phone'],
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

export function findAllPublic({ limit, offset } = {}) {
  return Product.findAll({
    attributes: PUBLIC_PRODUCT_ATTRIBUTES,
    include: [getCategoryInclude()],
    order: [['ProductID', 'ASC']],
    limit,
    offset,
  });
}

export function findByIdPublic(id) {
  return Product.findByPk(id, {
    attributes: PUBLIC_PRODUCT_ATTRIBUTES,
    include: [getCategoryInclude()],
  });
}

export function create(productData) {
  return Product.create(productData);
}