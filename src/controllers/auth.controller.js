// Registro, login y logout. La cookie es la única portadora del token.
import {
  SESSION_COOKIE_NAME,
  clearSessionCookieOptions,
  sessionCookieOptions,
} from '../config/auth.js';
import { authenticate, issueToken, registerUser } from '../services/auth.service.js';
import { HttpError } from '../utils/httpError.js';

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,50}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 255;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;

function parseRegistration(body) {
  const { username, email, password } = body ?? {};

  if (
    typeof username !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !username.trim() ||
    !email.trim() ||
    !password
  ) {
    throw new HttpError(400, 'Username, email y password son obligatorios');
  }

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!USERNAME_PATTERN.test(normalizedUsername)) {
    throw new HttpError(
      400,
      'Username inválido: entre 3 y 50 caracteres, solo letras, números, punto, guion y guion bajo',
    );
  }

  if (
    normalizedEmail.length > EMAIL_MAX_LENGTH ||
    !EMAIL_PATTERN.test(normalizedEmail)
  ) {
    throw new HttpError(400, 'Email inválido');
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new HttpError(400, 'La password debe tener al menos 8 caracteres');
  }

  if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) {
    throw new HttpError(400, 'La password no puede superar los 72 bytes');
  }

  return { username: normalizedUsername, email: normalizedEmail, password };
}

export async function register(req, res) {
  const user = await registerUser(parseRegistration(req.body));

  // Sin auto-login: el cliente debe pasar por /login después del alta.
  res.status(201).json({ user });
}

export async function login(req, res) {
  const { username, password } = req.body ?? {};

  if (
    typeof username !== 'string' ||
    !username.trim() ||
    typeof password !== 'string' ||
    !password
  ) {
    throw new HttpError(400, 'Username y password son obligatorios');
  }

  const user = await authenticate(username.trim(), password);

  if (!user) {
    throw new HttpError(401, 'Credenciales inválidas');
  }

  res.cookie(SESSION_COOKIE_NAME, issueToken(user), sessionCookieOptions());
  res.json({ user });
}

export function logout(req, res) {
  res.clearCookie(SESSION_COOKIE_NAME, clearSessionCookieOptions());
  res.status(204).end();
}
