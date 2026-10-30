// El logger no debe convertirse en una fuga: un error de Sequelize trae la
// consulta SQL y sus parámetros como propiedades enumerables.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { logger } from '../src/config/logger.js';

test('el error handler no registra SQL ni parámetros del error', () => {
  const calls = [];
  const originalError = logger.error;
  logger.error = (message, meta) => calls.push({ message, meta });

  const err = new Error('falló la consulta');
  err.sql = 'SELECT * FROM users WHERE email = ?';
  err.parameters = ['a@b.c'];

  try {
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };

    errorHandler(err, { method: 'GET', originalUrl: '/api/x' }, res, () => {});
  } finally {
    logger.error = originalError;
  }

  assert.equal(calls.length, 1);
  assert.equal(calls[0].message, 'falló la consulta');
  assert.equal(calls[0].meta.stack, err.stack);
  assert.equal(calls[0].meta.method, 'GET');
  assert.equal(calls[0].meta.url, '/api/x');

  const logged = JSON.stringify(calls[0]);
  assert.equal(logged.includes('SELECT'), false);
  assert.equal(logged.includes('a@b.c'), false);
});
