// Capa de datos de `products`: único punto que consulta Sequelize.
import { Category, Product, Supplier } from '../models/index.js';
import { HttpError } from '../utils/httpError.js';

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

export async function create(productData) {
  try {
    return await Product.create(productData);
  } catch (error) {
    // MySQL rechaza el INSERT cuando SupplierID o CategoryID no existen en sus
    // tablas. Sequelize lo expone como ForeignKeyConstraintError, que no trae
    // `status`; sin esta traducción el errorHandler respondería 500.
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      const field = error.fields?.[0];
      throw new HttpError(
        400,
        field ? `${field} no existe` : 'La referencia indicada no existe',
      );
    }

    // Validaciones propias del modelo (por ejemplo `allowNull: false`).
    // Sequelize entrega los issues en inglés; se traduce el primero a un
    // mensaje corto en español.
    if (error.name === 'SequelizeValidationError') {
      const issue = error.errors?.[0];

      if (!issue?.path) {
        throw new HttpError(400, 'Datos inválidos');
      }

      const message =
        issue.validatorKey === 'is_null' || issue.validatorKey === 'notNull'
          ? `${issue.path} es obligatorio`
          : `${issue.path} inválido`;

      throw new HttpError(400, message);
    }

    throw error;
  }
}