// Router de `orders`. Solo declara rutas; la lógica vive en el controlador.
import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';

export const orderRouter = Router();

orderRouter.get('/', orderController.list);
orderRouter.get('/:id', orderController.getById);
