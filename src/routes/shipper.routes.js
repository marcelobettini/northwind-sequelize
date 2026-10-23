// Router de `shippers`. Solo declara rutas; la lógica vive en el controlador.
import { Router } from 'express';
import * as shipperController from '../controllers/shipper.controller.js';

export const shipperRouter = Router();

shipperRouter.get('/', shipperController.list);
shipperRouter.get('/:id', shipperController.getById);
