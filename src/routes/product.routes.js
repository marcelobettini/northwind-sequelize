// Router de `products`. Solo declara rutas; la lógica vive en el controlador.
import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { createProductSchema } from '../schemas/product.schema.js';
import { validate } from '../middlewares/validate.js';
import { publicProductsLimiter } from '../middlewares/rateLimit.js';
import { publicCatalogCache } from '../middlewares/publicCache.js';

export const productRouter = Router();

productRouter.get('/', productController.list);
productRouter.get('/:id', productController.getById);
productRouter.post('/', validate(createProductSchema), productController.create);

export const publicProductRouter = Router();

// El catálogo es público y de solo lectura: se limita por cliente antes de
// tocar la base y se permite cachear la respuesta en clientes y proxies.
publicProductRouter.use(publicProductsLimiter, publicCatalogCache);
publicProductRouter.get('/', productController.listPublic);
publicProductRouter.get('/:id', productController.getByIdPublic);
