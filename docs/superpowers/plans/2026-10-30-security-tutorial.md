# Tutorial de seguridad — plan de implementación

> **Para quien ejecuta:** ejecutar las tareas en orden. Pasos con checkbox.

**Objetivo:** crear `TUTO.md` con índice y capítulo 1 (Helmet), e implementar
Helmet en `src/app.js`.

**Arquitectura:** Helmet se registra como primer middleware de `app.js`, antes
de los parsers y las rutas, para que aplique a todas las respuestas.

**Stack:** Node 24, Express 5, helmet 8.3.0 (ya instalado).

**Spec:** `docs/superpowers/specs/2026-10-30-security-tutorial-design.md`

## Restricciones globales

- No modificar el esquema ni agregar dependencias (helmet ya está instalado).
- Español; comandos para Windows/PowerShell (`curl.exe`).
- Conservar `app.disable('x-powered-by')` con un comentario que explique que
  Helmet también elimina la cabecera.
- No escribir los capítulos 2–4.

---

### Tarea 1: Helmet en `src/app.js`

**Archivos:**
- Modificar: `src/app.js:3-17`

**Interfaces:**
- Produce: `app` con Helmet activo para todas las rutas; lo consumen
  `src/index.js` y todas las suites de `test/`.

- [ ] **Paso 1:** importar `helmet` y registrar `app.use(helmet())` después de
      `app.disable('x-powered-by')` y antes de `express.json()`.
- [ ] **Paso 2:** comentar por qué se conserva `app.disable('x-powered-by')`.
- [ ] **Paso 3:** arrancar la app en un puerto efímero y comprobar con `fetch`
      que `/health` responde 200 y trae `content-security-policy`,
      `x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN`, y **no**
      trae `x-powered-by`.
- [ ] **Paso 4:** `npm test` (requiere MySQL) para descartar regresiones.

### Tarea 2: `TUTO.md`

**Archivos:**
- Crear: `TUTO.md`

- [ ] **Paso 1:** escribir encabezado, instrucciones de uso, requisitos e índice
      con los cuatro temas y su estado.
- [ ] **Paso 2:** escribir el capítulo 1 con las cinco secciones de la
      plantilla y las cabeceras reales observadas en el paso 3 de la tarea 1.
- [ ] **Paso 3:** verificar que cada comando del capítulo funcione tal como está
      escrito y que el resultado esperado coincida con la salida real.

### Tarea 3: límites de peticiones (capítulo 2)

**Archivos:**
- Crear: `src/middlewares/rateLimit.js`
- Modificar: `src/routes/auth.routes.js:8-10`
- Crear: `test/rateLimit.test.js`
- Modificar: `TUTO.md` (índice + capítulo 2)

- [ ] **Paso 1:** escribir `test/rateLimit.test.js` (login 10 fallos → 429;
      login exitoso no consume cuota; registro 30 intentos → 429) y verlo fallar.
- [ ] **Paso 2:** crear los limitadores y montarlos por ruta; ver el test pasar.
- [ ] **Paso 3:** capturar las cabeceras reales y el `429` con el servidor
      levantado.
- [ ] **Paso 4:** `npm test` completo.
- [ ] **Paso 5:** escribir el capítulo 2 con los valores observados.

### Tarea 4: CORS (capítulo 3)

**Archivos:**
- Crear: `src/middlewares/cors.js`
- Modificar: `src/app.js` (import + `app.use(corsMiddleware)` antes de las rutas)
- Modificar: `.env.example`
- Crear: `test/cors.test.js`
- Modificar: `TUTO.md` (índice + capítulo 3)

- [ ] **Paso 1:** `npm install cors`.
- [ ] **Paso 2:** escribir `test/cors.test.js` y verlo fallar.
- [ ] **Paso 3:** crear la allowlist y el middleware; montarlo antes de `requireAuth`.
- [ ] **Paso 4:** capturar el eco del origen, el preflight `204` y el rechazo de
      un origen ajeno con el servidor levantado.
- [ ] **Paso 5:** `npm test` completo.
- [ ] **Paso 6:** escribir el capítulo 3 con los valores observados.

### Tarea 5: Logging (capítulo 4)

**Archivos:**
- Crear: `src/config/logger.js`
- Crear: `src/middlewares/httpLogger.js`
- Crear: `.env.test`
- Crear: `test/logging.test.js`
- Modificar: `src/app.js` (montar `httpLogger` primero)
- Modificar: `src/middlewares/errorHandler.js` (usar el logger)
- Modificar: `src/index.js` (reemplazar `console.*`)
- Modificar: `.env.example`, `package.json` (script de test)
- Modificar: `TUTO.md` (índice + capítulo 4)

- [ ] **Paso 1:** `npm install winston morgan`.
- [ ] **Paso 2:** configurar el logger y el log de acceso; silenciar en tests.
- [ ] **Paso 3:** reemplazar `console.*` y registrar los `5xx` con contexto.
- [ ] **Paso 4:** verificar accesos, `/health`, `404`, ausencia de contraseña y
      JSON en producción con el servidor levantado.
- [ ] **Paso 5:** `npm test` completo y silencioso.
- [ ] **Paso 6:** escribir el capítulo 4, incluida la variante a archivo.
