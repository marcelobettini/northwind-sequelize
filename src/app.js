// Aplicación Express sin `listen`, para poder importarla en las pruebas.
// El arranque y la conexión a la base de datos viven en src/index.js.
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { apiRouter } from './routes/index.js';
import { authRouter } from './routes/auth.routes.js';
import { requireAuth } from './middlewares/auth.js';
import { corsMiddleware } from './middlewares/cors.js';
import { httpLogger } from './middlewares/httpLogger.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

export const app = express();

// Evita revelar que el servidor usa Express.
// Helmet también elimina esta cabecera: esta línea podría borrarse sin cambiar
// el resultado. Se mantiene porque documenta la intención de forma explícita.
app.disable('x-powered-by');

// Log de acceso. Va primero para registrar también lo que rechazan los demás
// middlewares (401, 404, preflight de CORS).
app.use(httpLogger);

// Cabeceras de seguridad en todas las respuestas (CSP, HSTS, nosniff, etc.) y
// eliminación de X-Powered-By. Va antes de las rutas para que las alcance.
app.use(helmet());

// CORS para el frontend en otro origen. Va antes de las rutas y de requireAuth:
// los preflight OPTIONS se responden acá y no deben pedir sesión.
app.use(corsMiddleware);

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
