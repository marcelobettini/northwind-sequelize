// Utilidades de test: crean un usuario real, se loguean y lo borran al final.
import bcrypt from 'bcryptjs';
import { User } from '../../src/models/index.js';

export const TEST_PASSWORD = 'TestPassword123';

let counter = 0;

export async function createTestUser({ isActive = true } = {}) {
  counter += 1;
  const suffix = `${process.pid}-${Date.now()}-${counter}`;

  return User.unscoped().create({
    Username: `test-${suffix}`,
    Email: `test-${suffix}@example.com`,
    // Rondas bajas: el costo de bcrypt no aporta nada en tests.
    PasswordHash: await bcrypt.hash(TEST_PASSWORD, 4),
    IsActive: isActive,
  });
}

export async function loginAs(baseUrl, username, password = TEST_PASSWORD) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const cookie = response.headers
    .getSetCookie()
    .map((setCookie) => setCookie.split(';')[0])
    .join('; ');

  return { response, cookie };
}

export async function deleteTestUser(user) {
  if (!user) {
    return;
  }

  await User.unscoped().destroy({ where: { UserID: user.UserID } });
}
