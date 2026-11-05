// Exige una cookie con un JWT válido. No consulta la base: el token firmado
// alcanza para saber que la sesión existió y no venció.
import { SESSION_COOKIE_NAME } from '../config/auth.js';
import { verifyToken } from '../services/auth.service.js';
import { User } from '../models/index.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  const payload = token ? verifyToken(token) : null;
  const userId = Number(payload?.sub);

  if (!payload || !Number.isInteger(userId)) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  req.auth = { userId };
  next();
}

// Las operaciones administrativas sí consultan la base: una degradación o
// desactivación debe tener efecto inmediato, sin esperar a que venza el token.
export async function requireAdmin(req, res, next) {
  const user = await User.unscoped().findOne({
    where: { UserID: req.auth.userId },
    attributes: ['UserID', 'IsAdmin', 'IsActive'],
  });

  if (!user || !user.IsActive) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  if (!user.IsAdmin) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  next();
}
