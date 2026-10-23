// Aplicación Express sin `listen`, para poder importarla en las pruebas.
// El arranque y la conexión a la base de datos viven en src/index.js.
import express from 'express';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

export const app = express();

// Evita revelar que el servidor usa Express.
app.disable('x-powered-by');

app.use('/api', apiRouter);

// Orden importante: primero 404, luego el manejador de errores.
app.use(notFound);
app.use(errorHandler);
