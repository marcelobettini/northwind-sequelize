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
    // Solo campos controlados: pasar el Error completo a Winston copia todas
    // sus propiedades enumerables, y un error de Sequelize incluye `sql` y
    // `parameters`. Tampoco se registran el body ni las cookies.
    logger.error(err?.message ?? String(err), {
      stack: err?.stack,
      method: req.method,
      url: req.originalUrl,
    });
  }

  res.status(status).json({
    error: status >= 500 ? 'Error interno del servidor' : err.message,
  });
}
