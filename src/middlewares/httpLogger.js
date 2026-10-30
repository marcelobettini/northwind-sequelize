// Log de acceso HTTP: una línea por petición, escrita en Winston con nivel
// `http`. No registra body, cookies ni cabeceras Authorization.
import morgan from 'morgan';
import { logger } from '../config/logger.js';

// En producción, el formato estándar de Apache. En desarrollo, una línea
// corta: método, ruta, estado y tiempo de respuesta.
const format =
  process.env.NODE_ENV === 'production'
    ? 'combined'
    : ':method :url :status :response-time ms';

export const httpLogger = morgan(format, {
  // Morgan entrega la línea ya formateada; el nivel y el destino los pone
  // Winston, así todo queda en el mismo flujo de logs.
  stream: { write: (line) => logger.http(line.trim()) },
  // El health check se consulta cada pocos segundos y no aporta nada.
  skip: (req) => logger.silent || req.path === '/health',
});
