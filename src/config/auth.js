// Configuración de autenticación. Se valida al importar para fallar al
// arrancar si falta el secreto, en lugar de fallar en cada request.

// Paso 1: leer una variable de entorno obligatoria.
// Si falta, se corta el arranque: sin secreto no se puede firmar ni validar tokens.
function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }

  return value;
}

// Paso 2: secreto con el que se firman los JWT. Se exige un mínimo de 32
// caracteres para que no sea fácil de adivinar por fuerza bruta.
export const JWT_SECRET = required('JWT_SECRET');

if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
}

// Paso 3: duración de la sesión en SEGUNDOS, la única unidad que usamos.
// jsonwebtoken acepta otros formatos ("12h", "7d"), pero estandarizamos en
// segundos para no mezclar unidades: es lo que espera cuando recibe un número.
// (Si le pasáramos milisegundos, el token duraría 1000 veces más.)
const DEFAULT_EXPIRES_IN_SECONDS = 12 * 60 * 60; // 12 horas

function parseExpiresInSeconds(value) {
  const seconds = Number(value);

  if (!Number.isInteger(seconds) || seconds <= 0) {
    throw new Error(
      `JWT_EXPIRES_IN_SECONDS inválida: "${value}" (usar segundos, por ejemplo 43200)`,
    );
  }

  return seconds;
}

export const JWT_EXPIRES_IN_SECONDS = process.env.JWT_EXPIRES_IN_SECONDS
  ? parseExpiresInSeconds(process.env.JWT_EXPIRES_IN_SECONDS)
  : DEFAULT_EXPIRES_IN_SECONDS;

// Única excepción: la cookie de sesión expresa su maxAge en MILISEGUNDOS,
// así que convertimos acá, una sola vez.
export const SESSION_MAX_AGE_MS = JWT_EXPIRES_IN_SECONDS * 1000;

// Nombre de la cookie donde viaja el token.
export const SESSION_COOKIE_NAME = 'access_token';

// Paso 4: opciones de la cookie de sesión.
// - httpOnly: JavaScript del navegador no puede leerla (mitiga XSS).
// - sameSite strict: no se envía en pedidos originados en otros sitios (mitiga CSRF).
// - secure: solo por HTTPS, y solo en producción.
// - maxAge: la cookie expira junto con el token.
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS,
  };
}

// Paso 5: para el logout se usan las mismas opciones pero sin maxAge, que es
// como se le pide al navegador que elimine la cookie.
export function clearSessionCookieOptions() {
  const { maxAge, ...options } = sessionCookieOptions();
  return options;
}
