// Exige una cookie con un JWT válido. No consulta la base: el token firmado
// alcanza para saber que la sesión existió y no venció.
import { SESSION_COOKIE_NAME } from '../config/auth.js';
import { verifyToken } from '../services/auth.service.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  next();
}
