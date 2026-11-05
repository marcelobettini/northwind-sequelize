// Traduce y valida los parámetros opcionales ?limit y ?offset.
// Sin parámetros no se pagina: el listado devuelve todas las filas.
// Si llega offset sin limit se aplica maxLimit, porque MySQL exige un
// LIMIT cuando se usa OFFSET. Cada endpoint puede imponer un tope menor.
import { HttpError } from './httpError.js';

export const MAX_LIMIT = 1000;

function parseNonNegativeInteger(value) {
  // Se exige string numérico: evita aceptar '', arrays o valores con signo.
  // El límite seguro evita offsets gigantes que MySQL no puede representar.
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function parsePagination({ limit, offset } = {}, maxLimit = MAX_LIMIT) {
  const options = {};

  if (limit !== undefined) {
    const value = parseNonNegativeInteger(limit);
    if (value === null || value < 1 || value > maxLimit) {
      throw new HttpError(400, `limit debe ser un entero entre 1 y ${maxLimit}`);
    }
    options.limit = value;
  }

  if (offset !== undefined) {
    const value = parseNonNegativeInteger(offset);
    if (value === null) {
      throw new HttpError(400, 'offset debe ser un entero mayor o igual a 0');
    }
    options.offset = value;
    options.limit ??= maxLimit;
  }

  return options;
}
