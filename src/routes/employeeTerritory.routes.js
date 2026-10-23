// Router de `employeeterritories`. La PK compuesta se recibe en dos params.
import { Router } from 'express';
import * as employeeTerritoryController from '../controllers/employeeTerritory.controller.js';

export const employeeTerritoryRouter = Router();

employeeTerritoryRouter.get('/', employeeTerritoryController.list);
employeeTerritoryRouter.get(
  '/:employeeId/:territoryId',
  employeeTerritoryController.getById,
);
