// Manejo centralizado de respuestas de error.
// El detalle se registra solo en el servidor; al cliente nunca se le envían
// stacks ni mensajes internos de la base de datos.

export function notFound(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

// Express identifica este middleware por sus cuatro parámetros: no quitarlos.
export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500;

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    error: status >= 500 ? 'Error interno del servidor' : err.message,
  });
}
