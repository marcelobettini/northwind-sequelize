// Router de `customercustomerdemo`. La PK compuesta se recibe en dos params.
import { Router } from 'express';
import * as customerCustomerDemoController from '../controllers/customerCustomerDemo.controller.js';

export const customerCustomerDemoRouter = Router();

customerCustomerDemoRouter.get('/', customerCustomerDemoController.list);
customerCustomerDemoRouter.get(
  '/:customerId/:customerTypeId',
  customerCustomerDemoController.getById,
);
