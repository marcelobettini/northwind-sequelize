// Router de `territories`. Solo declara rutas; la lógica vive en el controlador.
import { Router } from 'express';
import * as territoryController from '../controllers/territory.controller.js';

export const territoryRouter = Router();

territoryRouter.get('/', territoryController.list);
territoryRouter.get('/:id', territoryController.getById);
