// Aplicación Express sin `listen`, para poder importarla en las pruebas.
// El arranque y la conexión a la base de datos viven en src/index.js.
import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from './routes/index.js';
import { authRouter } from './routes/auth.routes.js';
import { requireAuth } from './middlewares/auth.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

export const app = express();

// Evita revelar que el servidor usa Express.
app.disable('x-powered-by');

// Middlewares para parsear el cuerpo de las requests.
app.use(express.json()); // parsea JSON
app.use(cookieParser()); // parsea cookies

// Público: sirve para saber si el proceso está vivo, sin tocar la base.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// El login/logout es público; el resto de /api exige la cookie.
app.use('/api/auth', authRouter);
app.use('/api', requireAuth, apiRouter);

// Orden importante: primero 404, luego el manejador de errores.
app.use(notFound);
app.use(errorHandler);
