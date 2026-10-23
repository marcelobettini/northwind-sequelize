// Router de `products`. Solo declara rutas; la lógica vive en el controlador.
import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';

export const productRouter = Router();

productRouter.get('/', productController.list);
productRouter.get('/:id', productController.getById);
