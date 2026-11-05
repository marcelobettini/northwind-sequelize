// Límite de peticiones por IP en los endpoints públicos de autenticación.
// El store por defecto vive en memoria: cuenta por proceso y se reinicia con
// el servidor; con varias instancias hace falta un store compartido.
import { rateLimit } from 'express-rate-limit';

const MINUTE_MS = 60 * 1000;

// Login: solo descuentan los intentos fallidos (1xx/2xx/3xx no cuentan), así
// que un usuario que inicia sesión varias veces con credenciales válidas no
// consume cuota. La petición que supera el límite se corta acá, antes de
// validar las credenciales.
export const loginLimiter = rateLimit({
  windowMs: 15 * MINUTE_MS,
  limit: 10,
  identifier: 'login',
  standardHeaders: 'draft-8', // cabecera RateLimit + RateLimit-Policy
  legacyHeaders: false, // sin X-RateLimit-*
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos de login. Probá de nuevo más tarde.' },
});

// Registro: cada alta ejecuta bcrypt (costo 10), así que se cuentan todos los
// intentos, también los que terminan en 400 o 409. 30 altas por hora y por
// cliente (IP, o subred /56 en IPv6) dejan pasar a un usuario real y frenan la
// creación masiva de cuentas.
export const registerLimiter = rateLimit({
  windowMs: 60 * MINUTE_MS,
  limit: 30,
  identifier: 'register',
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados registros desde esta IP. Probá más tarde.' },
});

// Catálogo público: lectura sin sesión. Se cuentan todos los requests porque
// cada uno consulta la base; no hay respuestas que se puedan descontar. 120
// por minuto y por cliente dejan usar el catálogo a un frontend real y a
// varias personas detrás de una misma IP, pero cortan el scraping sistemático.
export const publicProductsLimiter = rateLimit({
  windowMs: MINUTE_MS,
  limit: 120,
  identifier: 'public-products',
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes al catálogo. Probá de nuevo más tarde.',
  },
});
