// Router de `suppliers`. Solo declara rutas; la lógica vive en el controlador.
import { Router } from 'express';
import * as supplierController from '../controllers/supplier.controller.js';

export const supplierRouter = Router();

supplierRouter.get('/', supplierController.list);
supplierRouter.get('/:id', supplierController.getById);
