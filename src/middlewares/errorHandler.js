// Manejo centralizado de respuestas de error.
// El detalle se registra solo en el servidor; al cliente nunca se le envían
// stacks ni mensajes internos de la base de datos.
import { logger } from '../config/logger.js';

export function notFound(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

// Express identifica este middleware por sus cuatro parámetros: no quitarlos.
export function errorHandler(err, req, res, next) {
  // body-parser no debe exponer el detalle del parser al cliente.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }

  const status = err.status ?? 500;

  if (status >= 500) {
    // Se registra el error, nunca el body ni las cookies. Tampoco el objeto
    // crudo de Sequelize: puede incluir la consulta SQL y sus parámetros.
    logger.error(err, { method: req.method, url: req.originalUrl });
  }

  res.status(status).json({
    error: status >= 500 ? 'Error interno del servidor' : err.message,
  });
}
