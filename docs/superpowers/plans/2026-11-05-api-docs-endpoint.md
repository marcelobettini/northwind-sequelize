# Documentación OpenAPI servida por la aplicación — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Servir `src/docs/api-spec.yml` en `/openapi.yaml` siempre y Swagger UI en `/api-docs` solo en desarrollo (o con `ENABLE_API_DOCS=true`).

**Architecture:** Dos rutas públicas registradas en `src/app.js` antes del `helmet()` global y de `/api`, con un `helmet` propio de CSP relajado para la documentación. El servidor no parsea YAML: Swagger UI lo descarga del endpoint crudo.

**Tech Stack:** Node.js 24, Express 5, `swagger-ui-express` 5 (ya instalado), `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-05-api-docs-endpoint-design.md`

## Global Constraints

- No agregar dependencias nuevas.
- No modificar `src/docs/api-spec.yml` ni el resto de los contratos.
- Las rutas de documentación no deben pasar por `app.use('/api', requireAuth, apiRouter)`.
- El CSP estricto del resto de la aplicación no cambia.
- Comentarios y nombres de tests en español, siguiendo el estilo del proyecto.

## Review Focus

- `/api-docs` sin barra final: debe redirigir a `/api-docs/`; si no, los assets relativos (`./swagger-ui.css`) se piden a la raíz y la UI queda en blanco.
- Las rutas de docs son públicas: un test sin cookie debe recibir `302`/`200`, nunca `401`.
- En producción sin `ENABLE_API_DOCS`: `/api-docs` responde `404` pero `/openapi.yaml` sigue en `200`.
- Swagger UI usa `<style>` inline: con el CSP por defecto de Helmet la página queda en blanco; el test debe verificar `'unsafe-inline'` en `style-src`.
- `NODE_ENV` distinto de `production` (incluido ausente) habilita la UI: es el default de desarrollo.

---

### Task 1: Servir el contrato crudo en `/openapi.yaml`

**Files:**
- Modify: `src/app.js`
- Create: `test/docs.test.js`

**Interfaces:**
- Consumes: `helmet` (ya importado en `src/app.js`).
- Produces: `GET /openapi.yaml` con `200`, `Content-Type` YAML y el archivo `src/docs/api-spec.yml` como body.

- [ ] **Step 1: Escribir el test que falla**

Crear `test/docs.test.js` con el setup de servidor usado por el resto de las suites y el primer test:

```js
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { sequelize } from '../src/config/database.js';

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
});

test('GET /openapi.yaml responde el contrato sin autenticación', async () => {
  const response = await fetch(`${baseUrl}/openapi.yaml`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /yaml/);
  assert.match(await response.text(), /^openapi:/);
});
```

- [ ] **Step 2: Ejecutar el test y verificar que falla**

Run: `node --env-file-if-exists=.env --env-file-if-exists=.env.test --test test/docs.test.js`
Expected: FAIL con `response.status` `404` en lugar de `200`.

- [ ] **Step 3: Implementar la ruta**

En `src/app.js`, agregar el import junto a los demás de Node:

```js
import { fileURLToPath } from 'node:url';
```

Después de los imports y antes de `export const app = express();`, definir la ruta absoluta del contrato y el CSP de documentación:

```js
// La ruta se resuelve desde este módulo para no depender del cwd.
const API_SPEC_PATH = fileURLToPath(new URL('./docs/api-spec.yml', import.meta.url));

// Swagger UI usa estilos inline que el CSP por defecto de Helmet bloquea.
// La documentación usa este CSP propio; el resto de la app conserva el estricto.
const docsSecurity = helmet({
  contentSecurityPolicy: {
    directives: {
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      upgradeInsecureRequests: null,
    },
  },
});
```

Insertar la ruta justo después de `app.use(httpLogger);` y antes de `app.use(helmet());`:

```js
// Documentación: fuera de /api para que no exija sesión.
app.get('/openapi.yaml', docsSecurity, (req, res) => {
  res.sendFile(API_SPEC_PATH);
});
```

- [ ] **Step 4: Ejecutar el test y verificar que pasa**

Run: `node --env-file-if-exists=.env --env-file-if-exists=.env.test --test test/docs.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/app.js test/docs.test.js
git commit -m "feat: serve OpenAPI spec at /openapi.yaml"
```

---

### Task 2: Swagger UI en `/api-docs` con gating por entorno

**Files:**
- Modify: `src/app.js`
- Modify: `test/docs.test.js`
- Create: `test/docs.production.test.js`
- Create: `test/docs.production-flag.test.js`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `API_SPEC_PATH` y `docsSecurity` de la Task 1.
- Produces: `GET /api-docs` → `302` a `/api-docs/`; `GET /api-docs/` → `200` HTML; `GET /api-docs/*` → assets; todo `404` cuando `NODE_ENV=production` y `ENABLE_API_DOCS` no es `true`.

- [ ] **Step 1: Escribir los tests que fallan (desarrollo)**

Agregar a `test/docs.test.js`:

```js
test('GET /api-docs redirige a /api-docs/ para que resuelvan los assets', async () => {
  const response = await fetch(`${baseUrl}/api-docs`, { redirect: 'manual' });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/api-docs/');
});

test('GET /api-docs/ responde la UI sin autenticación', async () => {
  const response = await fetch(`${baseUrl}/api-docs/`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /html/);
  assert.match(await response.text(), /swagger-ui/);
});

test('los assets de la UI se sirven bajo /api-docs/', async () => {
  const response = await fetch(`${baseUrl}/api-docs/swagger-ui.css`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /css/);
});

test('la UI recibe un CSP compatible con Swagger UI', async () => {
  const response = await fetch(`${baseUrl}/api-docs/`);
  const csp = response.headers.get('content-security-policy');

  assert.match(csp, /style-src[^;]*'unsafe-inline'/);
  assert.doesNotMatch(csp, /upgrade-insecure-requests/);
});
```

- [ ] **Step 2: Escribir los tests que fallan (producción)**

Crear `test/docs.production.test.js`. El `NODE_ENV` se asigna antes del import dinámico porque la habilitación se decide al registrar las rutas:

```js
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'production';
delete process.env.ENABLE_API_DOCS;

const { app } = await import('../src/app.js');
const { sequelize } = await import('../src/config/database.js');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
});

test('sin ENABLE_API_DOCS, /api-docs no existe en producción', async () => {
  const response = await fetch(`${baseUrl}/api-docs/`);

  assert.equal(response.status, 404);
});

test('/openapi.yaml sigue disponible en producción', async () => {
  const response = await fetch(`${baseUrl}/openapi.yaml`);

  assert.equal(response.status, 200);
});
```

Crear `test/docs.production-flag.test.js`:

```js
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'production';
process.env.ENABLE_API_DOCS = 'true';

const { app } = await import('../src/app.js');
const { sequelize } = await import('../src/config/database.js');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
});

test('ENABLE_API_DOCS=true habilita la UI en producción', async () => {
  const response = await fetch(`${baseUrl}/api-docs/`);

  assert.equal(response.status, 200);
});
```

- [ ] **Step 3: Ejecutar los tests y verificar que fallan**

Run: `node --env-file-if-exists=.env --env-file-if-exists=.env.test --test test/docs.test.js test/docs.production.test.js test/docs.production-flag.test.js`
Expected: FAIL. En desarrollo `/api-docs` responde `404`; en producción el test del flag responde `404` en lugar de `200`.

- [ ] **Step 4: Implementar la UI y el gating**

En `src/app.js`, agregar el import:

```js
import swaggerUi from 'swagger-ui-express';
```

Justo después de la ruta `/openapi.yaml` y antes de `app.use(helmet());`:

```js
const docsEnabled =
  process.env.NODE_ENV !== 'production' ||
  process.env.ENABLE_API_DOCS === 'true';

if (docsEnabled) {
  // La UI usa rutas relativas para sus assets: sin la barra final se piden
  // en la raíz del sitio y la página queda vacía.
  app.get(/^\/api-docs$/, (req, res) => {
    res.redirect('/api-docs/');
  });

  app.use(
    '/api-docs',
    docsSecurity,
    swaggerUi.serve,
    swaggerUi.setup(null, {
      swaggerOptions: { url: '/openapi.yaml' },
    }),
  );
}
```

- [ ] **Step 5: Documentar el flag**

Agregar a `.env.example`, después de la línea de `NODE_ENV`:

```bash
# Habilita Swagger UI también en producción (en desarrollo está activa siempre).
ENABLE_API_DOCS=false
```

- [ ] **Step 6: Ejecutar toda la suite y verificar que pasa**

Run: `npm test`
Expected: PASS, incluidos los 7 tests nuevos de documentación.

- [ ] **Step 7: Commit**

```bash
git add src/app.js test/docs.test.js test/docs.production.test.js test/docs.production-flag.test.js .env.example
git commit -m "feat: serve Swagger UI at /api-docs in development"
```
