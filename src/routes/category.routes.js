// Router de `categories`. Solo declara rutas; la lógica vive en el controlador.
import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';

export const categoryRouter = Router();

categoryRouter.get('/', categoryController.list);
categoryRouter.get('/:id', categoryController.getById);
