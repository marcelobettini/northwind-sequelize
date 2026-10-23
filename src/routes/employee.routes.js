// Router de `employees`. Solo declara rutas; la lógica vive en el controlador.
import { Router } from 'express';
import * as employeeController from '../controllers/employee.controller.js';

export const employeeRouter = Router();

employeeRouter.get('/', employeeController.list);
employeeRouter.get('/:id', employeeController.getById);
