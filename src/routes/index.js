// Agrupa los routers de cada tabla bajo el prefijo /api.
import { Router } from 'express';
import { categoryRouter } from './category.routes.js';
import { customerRouter } from './customer.routes.js';
import { customerDemographicRouter } from './customerDemographic.routes.js';
import { customerCustomerDemoRouter } from './customerCustomerDemo.routes.js';
import { employeeRouter } from './employee.routes.js';
import { employeeTerritoryRouter } from './employeeTerritory.routes.js';
import { orderRouter } from './order.routes.js';
import { orderDetailRouter } from './orderDetail.routes.js';
import { productRouter } from './product.routes.js';
import { regionRouter } from './region.routes.js';
import { shipperRouter } from './shipper.routes.js';
import { supplierRouter } from './supplier.routes.js';
import { territoryRouter } from './territory.routes.js';

export const apiRouter = Router();

apiRouter.use('/categories', categoryRouter);
apiRouter.use('/customers', customerRouter);
apiRouter.use('/customerdemographics', customerDemographicRouter);
apiRouter.use('/customercustomerdemo', customerCustomerDemoRouter);
apiRouter.use('/employees', employeeRouter);
apiRouter.use('/employeeterritories', employeeTerritoryRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/orderdetails', orderDetailRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/region', regionRouter);
apiRouter.use('/shippers', shipperRouter);
apiRouter.use('/suppliers', supplierRouter);
apiRouter.use('/territories', territoryRouter);
