// Router de `region`. Solo declara rutas; la lógica vive en el controlador.
import { Router } from 'express';
import * as regionController from '../controllers/region.controller.js';

export const regionRouter = Router();

regionRouter.get('/', regionController.list);
regionRouter.get('/:id', regionController.getById);
