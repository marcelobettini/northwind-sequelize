// Autenticación de usuarios: alta, verificación de credenciales y JWT.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_EXPIRES_IN_SECONDS, JWT_SECRET } from '../config/auth.js';
import { User } from '../models/index.js';
import { HttpError } from '../utils/httpError.js';

const BCRYPT_ROUNDS = 10;

// Hash de una password aleatoria con el mismo costo que los usuarios reales.
// Se usa cuando el usuario no existe para que el tiempo de respuesta no revele
// si el username es válido.
const DUMMY_PASSWORD_HASH = '$2b$10$WwwhEARx6plbe1YYbqCrEeP9CC9fZec.G37R81O.hXLePenpCK3XG';

export async function registerUser({ username, email, password }) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    const user = await User.unscoped().create({
      Username: username,
      Email: email,
      PasswordHash: passwordHash,
      PasswordChangedAt: new Date(),
    });

    return { UserID: user.UserID, Username: user.Username, Email: user.Email };
  } catch (error) {
    // La base garantiza la unicidad; esto cubre también dos registros simultáneos.
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new HttpError(409, 'El username o email ya está en uso');
    }

    throw error;
  }
}

export async function authenticate(username, password) {
  const user = await User.unscoped().findOne({
    where: { Username: username },
    attributes: ['UserID', 'Username', 'Email', 'PasswordHash', 'IsActive'],
  });

  const passwordMatches = await bcrypt.compare(
    password,
    user?.PasswordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordMatches || !user.IsActive) {
    return null;
  }

  return { UserID: user.UserID, Username: user.Username, Email: user.Email };
}

export function issueToken(user) {
  return jwt.sign({ sub: String(user.UserID) }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN_SECONDS,
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
