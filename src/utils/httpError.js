// Error con código HTTP. Permite que las validaciones (por ejemplo, la
// paginación) señalen un 4xx sin depender de Express; el error handler
// central es quien lo traduce a una respuesta JSON.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}
