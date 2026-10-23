// Router de `orderdetails`. La PK compuesta se recibe en dos params.
import { Router } from 'express';
import * as orderDetailController from '../controllers/orderDetail.controller.js';

export const orderDetailRouter = Router();

orderDetailRouter.get('/', orderDetailController.list);
orderDetailRouter.get('/:orderId/:productId', orderDetailController.getById);
