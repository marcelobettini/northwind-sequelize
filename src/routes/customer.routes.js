// Router de `customers`. Solo declara rutas; la lógica vive en el controlador.
import { Router } from 'express';
import * as customerController from '../controllers/customer.controller.js';

export const customerRouter = Router();

customerRouter.get('/', customerController.list);
customerRouter.get('/:id', customerController.getById);
