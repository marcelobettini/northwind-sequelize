// Router de `customerdemographics`.
import { Router } from 'express';
import * as customerDemographicController from '../controllers/customerDemographic.controller.js';

export const customerDemographicRouter = Router();

customerDemographicRouter.get('/', customerDemographicController.list);
customerDemographicRouter.get('/:id', customerDemographicController.getById);
