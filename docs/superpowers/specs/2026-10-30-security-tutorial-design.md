# Tutorial de seguridad — diseño

## Intención

`TUTO.md` es un tutorial progresivo de seguridad para esta API (Express 5 +
Sequelize 6 + MySQL). Cada capítulo explica un concepto y lo implementa en el
proyecto al mismo tiempo, para que el alumno lea y compruebe el efecto.

## Objetivos

- Un concepto por capítulo, en orden de dependencia.
- Plantilla fija por capítulo: **Qué es**, **Instalación**, **Para qué sirve**,
  **Implementación**, **Casos de uso**.
- Sintético: sin relleno, sin repetir lo que el código ya dice.
- Cada caso de uso se puede ejecutar (comando, ruta o ejercicio) y dice qué
  resultado esperar.

## No objetivos

- No es un manual de Express ni de Sequelize.
- No cubre despliegue, contenedores ni infraestructura.
- No inventa requisitos que el proyecto no tenga.

## Índice acordado

1. Helmet: cabeceras HTTP seguras.
2. Límites de peticiones: `express-rate-limit`.
3. CORS: frontend en otro origen (`localhost`, puerto distinto).
4. Logging: Winston + Morgan.

Solo el capítulo 1 se escribe en la primera entrega; los demás quedan listados
como pendientes. El índice marca el estado de cada uno.

## Capítulo 2: límites de peticiones

- Se aplica solo a los endpoints públicos de autenticación, no a toda la API.
- `/login`: 10 intentos **fallidos** por 15 minutos por IP, con
  `skipSuccessfulRequests: true`.
- `/register`: 30 intentos por hora por IP, contando también los `400`/`409`,
  porque cada alta ejecuta `bcrypt` y el endpoint permite crear cuentas en masa.
- `msg` propio en el `429` con el formato de error de la API y cabeceras
  `RateLimit`/`RateLimit-Policy` (draft-8) más `Retry-After`.
- Los limitadores viven en `src/middlewares/rateLimit.js` y se montan por ruta
  en `src/routes/auth.routes.js`.
- Se agrega `test/rateLimit.test.js`: 429 tras agotar la cuota, y verificación
  de que un login exitoso no la consume.

## Capítulo 3: CORS

- Frontend confirmado: Vite en `http://localhost:5173`, backend en `:3000`.
- Se agrega la dependencia `cors` (justificada: sin ella el navegador no deja
  leer las respuestas ni enviar la cookie de sesión).
- Allowlist por `CORS_ORIGINS` (lista separada por comas) con default
  `http://localhost:5173`; documentada en `.env.example`.
- `credentials: true` porque la sesión viaja en cookie `httpOnly`.
- El middleware se monta antes de `/api` y de `requireAuth`: los `OPTIONS` de
  preflight no llevan cookies.
- Se agrega `test/cors.test.js`: eco del origen permitido, preflight de ruta
  protegida sin sesión y origen ajeno sin `Access-Control-Allow-Origin`.

## Capítulo 4: Logging

- Dependencias: `winston` (logger de aplicación) y `morgan` (acceso HTTP).
- Salida a stdout, sin archivos ni rotación por defecto. El capítulo documenta
  la variante con `winston.transports.File` y `winston-daily-rotate-file`, sin
  instalar esta última.
- Nivel por `LOG_LEVEL`, default `http` para que los accesos se registren; con
  `info` se pierden.
- Formato legible en desarrollo (color solo si la salida es TTY) y JSON en
  producción.
- `httpLogger` se monta primero; salta `/health` y respeta `logger.silent`.
- `errorHandler` registra solo los `5xx`, con método y URL, sin body ni el
  error crudo de Sequelize.
- `src/index.js` deja de usar `console.*`.
- `.env.test` con `LOG_LEVEL=silent` y el script de test carga `.env` y
  `.env.test` (el último gana), para no inundar la salida.

## Decisiones

- Idioma: español, igual que el resto de la documentación del repo.
- Los comandos usan `curl.exe` porque el entorno es Windows/PowerShell.
- `app.disable('x-powered-by')` se conserva y se comenta: Helmet ya elimina la
  cabecera, así que la línea es redundante pero documenta la intención.
- Helmet se monta antes de las rutas y de los parsers, con configuración por
  defecto.
- El capítulo 1 no agrega dependencias ni tests nuevos: se verifica con
  `curl.exe` y con la suite existente.
