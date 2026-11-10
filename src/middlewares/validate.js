// Valida el body de una request con un schema de Zod antes de que llegue
// al controlador. `validate(schema)` devuelve el middleware Express, así
// el router solo declara qué schema usa cada ruta.
//
// Cómo usa el schema: `safeParse` valida sin lanzar. Si el body pasa,
// `req.body` se reemplaza por el resultado parseado: el controlador recibe
// el dato saneado — recortado (`.trim()`) y sin claves que el schema no
// declaró (los schemas son `strictObject`: una clave desconocida como
// `ProductID` se rechaza en lugar de ignorarse).
//
// Cómo se conecta con el manejo de errores: ante un body inválido se llama
// `next(new HttpError(400, ...))`, que corta la cadena y cae en el
// `errorHandler` central. Como `HttpError` define `status`, ese middleware
// responde ese código con `err.message` al cliente y, al ser un 400, no lo
// registra en el log como error de servidor. El mensaje que recibe el cliente
// es el primero que emite Zod.
import { HttpError } from '../utils/httpError.js';

export function validate(schema) {
  return (req, _res, next) => {
    // Express 5 deja `req.body` undefined si la request no trae JSON.
    const rawBody = req.body ?? {};
    const result = schema.safeParse(rawBody);

    if (result.success) {
      req.body = result.data;
      return next();
    }

    next(new HttpError(400, result.error.issues[0].message));
  };
}
