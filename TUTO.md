# Seguridad y buenas prácticas en la API

Tutorial progresivo sobre seguridad para esta API (Node.js 24, Express 5,
Sequelize 6, MySQL). Cada capítulo explica un concepto y lo implementa en el
proyecto al mismo tiempo, para que puedas leer, ejecutar y comprobar el efecto.

## Cómo usar el tutorial

- Los capítulos se leen en orden: cada uno asume el anterior.
- Todos siguen la misma estructura: **Qué es**, **Instalación**, **Para qué
  sirve**, **Implementación** y **Casos de uso**.
- Los comandos están escritos para Windows/PowerShell; en Linux o macOS usá
  `curl` en lugar de `curl.exe`. (`curl` a secas en PowerShell es un alias de
  `Invoke-WebRequest` y no acepta las mismas opciones.)
- Los casos de uso indican qué resultado esperar. Si el resultado no coincide,
  no sigas: el capítulo siguiente da por sentado este.

## Requisitos

- Dependencias instaladas (`npm install`).
- MySQL con la base Northwind y un `.env` con `DB_*` y `JWT_SECRET` (mínimo 32
  caracteres).
- Para levantar la API: `npm run dev` → `http://localhost:3000`.

## Índice

| # | Tema | Estado |
|---|------|--------|
| 1 | Helmet: cabeceras HTTP seguras | Implementado |
| 2 | Límites de peticiones: `express-rate-limit` | Implementado |
| 3 | CORS: frontend en otro origen | Implementado |
| 4 | Logging: Winston + Morgan | Implementado |

---

## 1. Helmet

### Qué es

Helmet es un conjunto de middlewares de Express que escribe cabeceras HTTP de
seguridad en cada respuesta y elimina otras que delatan al servidor.
`app.use(helmet())` activa la configuración recomendada por defecto.

No es un firewall ni un validador: no mira el cuerpo, la URL ni las cookies.
Solo cambia lo que viaja en la cabecera de la respuesta. Por eso es una capa
barata que se pone una vez y se olvida.

### Instalación

```bash
npm install helmet
```

En este proyecto ya está instalado (`helmet@^8.3.0`, ver `package.json`). Para
comprobarlo:

```bash
npm ls helmet
```

### Para qué sirve

Cada cabecera le dice al navegador cómo comportarse frente a un ataque
concreto:

| Cabecera | Valor por defecto | Qué evita |
|---|---|---|
| `X-Powered-By` | se elimina | Fingerprinting: no revelar que el backend usa Express |
| `Content-Security-Policy` | `default-src 'self'; …` | XSS: los scripts solo pueden venir del propio origen (estilos `https:` e inline, imágenes `data:`) |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Volver a HTTP por downgrade o MITM (solo tiene efecto sobre HTTPS) |
| `X-Content-Type-Options` | `nosniff` | Que el navegador adivine el tipo y ejecute un archivo como script |
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking: embeber la página en un iframe ajeno |
| `frame-ancestors` (CSP) | `'self'` | Lo mismo que la anterior, con el mecanismo moderno |
| `Referrer-Policy` | `no-referrer` | Filtrar URLs internas en el header `Referer` |
| `Cross-Origin-Opener-Policy` | `same-origin` | Aislar la ventana de otros orígenes (fugas tipo Spectre) |
| `Cross-Origin-Resource-Policy` | `same-origin` | Que otros sitios embeban tus recursos |
| `Origin-Agent-Cluster` | `?1` | Aislar el contexto de JavaScript por origen |
| `X-DNS-Prefetch-Control` | `off` | Resolución DNS anticipada no deseada |
| `X-Download-Options` | `noopen` | Descargas que se ejecutan solas (IE) |
| `X-Permitted-Cross-Domain-Policies` | `none` | Políticas cross-domain de Flash y PDF |
| `X-XSS-Protection` | `0` | Desactiva el filtro XSS antiguo, que introducía vulnerabilidades |

Lo que Helmet **no** hace: validar la entrada, autenticar, autorizar, cifrar la
conexión ni proteger la base de datos. Es una capa más, no un reemplazo.

### Implementación

En `src/app.js`, Helmet se registra antes de los parsers y de las rutas:

```js
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
// …

export const app = express();

// Evita revelar que el servidor usa Express.
// Helmet también elimina esta cabecera: esta línea podría borrarse sin cambiar
// el resultado. Se mantiene porque documenta la intención de forma explícita.
app.disable('x-powered-by');

// Cabeceras de seguridad en todas las respuestas (CSP, HSTS, nosniff, etc.) y
// eliminación de X-Powered-By. Va antes de las rutas para que las alcance.
app.use(helmet());

// Middlewares para parsear el cuerpo de las requests.
app.use(express.json());
app.use(cookieParser());
```

El orden importa: los middlewares se ejecutan en el orden en que se registran.
Si `helmet()` va después de las rutas, no alcanza a las respuestas que ya se
enviaron.

La configuración por defecto sirve para una API JSON. Cuando haga falta
ajustarla, se cambian solo las directivas necesarias: las demás conservan su
valor por defecto.

```js
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'img-src': ["'self'", 'https://cdn.ejemplo.com'],
      },
    },
  }),
);
```

### Casos de uso

**1. Ver las cabeceras.** Con `npm run dev` corriendo:

```bash
curl.exe -i http://localhost:3000/health
```

Salida esperada (resumida):

```http
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Content-Type: application/json; charset=utf-8
Content-Length: 15

{"status":"ok"}
```

**2. Confirmar que `X-Powered-By` desapareció.**

```bash
curl.exe -sI http://localhost:3000/health | Select-String "x-powered-by"
```

No debe imprimir nada.

**3. Comparar con y sin Helmet.** Comentá `app.use(helmet());`, guardá (con
`node --watch` el servidor se reinicia solo) y repetí el `curl` del punto 1.
Desaparecen todas las cabeceras de la tabla, pero `X-Powered-By` sigue ausente
porque `app.disable('x-powered-by')` continúa activo. Volvé a descomentarlo.

**4. Entender HSTS.** `Strict-Transport-Security` aparece incluso en
`http://localhost`, pero el navegador **ignora** esa cabecera si la recibió por
HTTP: solo se aplica sobre HTTPS. En producción, con TLS, el navegador recuerda
durante un año (`max-age=31536000`) que ese dominio y sus subdominios
(`includeSubDomains`) deben ir siempre por HTTPS. Es un compromiso difícil de
revertir: si el dominio deja de tener HTTPS, los usuarios quedan bloqueados
hasta que expire. Por eso se empieza con un `max-age` corto.

**5. Ver la CSP en acción (ejercicio).** La CSP solo se aplica a documentos
HTML: sobre un JSON no hay nada que bloquear. Agregá temporalmente una ruta que
devuelva HTML, junto a `/health` y antes de `app.use(notFound)` (si va después,
responde 404):

```js
app.get('/demo-csp', (req, res) => {
  res.type('html').send('<h1>Demo</h1><script>alert("inline")</script>');
});
```

Abrí `http://localhost:3000/demo-csp`: el título se ve, pero el `alert` no se
ejecuta. En la consola del navegador aparece `Refused to execute inline script…`
porque `script-src 'self'` no permite scripts embebidos. La solución correcta
en producción es un *nonce* o un *hash* por respuesta, no `'unsafe-inline'`.
Borrá la ruta de prueba al terminar.

**6. Comprobar que nada se rompió.** Helmet solo agrega cabeceras, así que la
autenticación y las rutas siguen igual:

```bash
curl.exe -i http://localhost:3000/api/products
```

Debe responder `401` con `{"error":"No autenticado"}`. Y la suite completa:

```bash
npm test
```

Debe terminar con `fail 0`.

### Buenas prácticas

- No desactives Helmet en producción; si algo se rompe, ajustá la cabecera que
  corresponda (`contentSecurityPolicy`, `crossOriginResourcePolicy`, etc.).
- La CSP se afina con *nonces* o *hashes*, no bajando a `'unsafe-inline'`.
- HSTS se activa cuando HTTPS ya funciona en todos los subdominios, y con un
  `max-age` creciente.
- Helmet no reemplaza la validación de entrada, la autenticación ni las
  consultas parametrizadas: cada capítulo siguiente cubre otra capa.
- Mantené la dependencia al día (`npm outdated helmet`, `npm audit`): las
  cabeceras y sus valores por defecto cambian entre versiones.
- `app.disable('x-powered-by')` es redundante con Helmet; se conserva como
  documentación de la intención.

---

## 2. Límites de peticiones

### Qué es

`express-rate-limit` es un middleware que cuenta las peticiones de cada cliente
dentro de una ventana de tiempo y, al superar el límite, responde `429 Too Many
Requests` sin llegar al controlador. Usa una ventana fija: el contador se
reinicia al vencer `windowMs`.

Viene con un store en memoria (`MemoryStore`), suficiente para un proceso. A
diferencia de Helmet, que solo agrega cabeceras, este middleware **rechaza**
peticiones.

### Instalación

```bash
npm install express-rate-limit
```

Ya está instalado (`express-rate-limit@^8.7.2`). Para comprobarlo:

```bash
npm ls express-rate-limit
```

### Para qué sirve

| Endpoint | Qué cuenta | Límite | Por qué |
|---|---|---|---|
| `POST /api/auth/login` | solo intentos fallidos | 10 / 15 min | Fuerza bruta y *credential stuffing* |
| `POST /api/auth/register` | todos los intentos | 30 / hora | DoS con `bcrypt`, cuentas masivas, enumeración |

- **Fuerza bruta y *credential stuffing*:** probar contraseñas o listas de
  credenciales filtradas contra `/login`.
- **Agotamiento de CPU:** cada login y cada alta ejecutan `bcrypt` con costo 10
  (`BCRYPT_ROUNDS`). Unas pocas decenas de peticiones por segundo ocupan la CPU
  del servidor; no hace falta adivinar ninguna contraseña.
- **Creación masiva de cuentas:** spam, crecimiento de la base y costo futuro de
  correos o procesos asociados.
- **Enumeración:** el `409` de `/register` confirma si un username o email ya
  existe; limitar el ritmo hace lenta esa búsqueda.

¿Por qué también `/register`? Porque es el endpoint más caro de los dos: hashea
sin necesitar credenciales válidas y permite crear cuentas en serie. La
diferencia es qué se descuenta: en `/login` los inicios de sesión exitosos no
consumen cuota (`skipSuccessfulRequests`), para no castigar a un usuario
legítimo; en `/register` se cuentan todos, incluidos los que terminan en `400` o
`409`.

Lo que **no** hace: no protege contra un ataque distribuido desde miles de IP
(cada una tiene su propia cuota), no reemplaza contraseñas fuertes ni MFA, y con
el store en memoria no coordina varias instancias del servidor.

### Implementación

`src/middlewares/rateLimit.js`:

```js
import { rateLimit } from 'express-rate-limit';

const MINUTE_MS = 60 * 1000;

export const loginLimiter = rateLimit({
  windowMs: 15 * MINUTE_MS,
  limit: 10,
  identifier: 'login',
  standardHeaders: 'draft-8', // cabecera RateLimit + RateLimit-Policy
  legacyHeaders: false, // sin X-RateLimit-*
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos de login. Probá de nuevo más tarde.' },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * MINUTE_MS,
  limit: 30,
  identifier: 'register',
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados registros desde esta IP. Probá más tarde.' },
});
```

Y se montan por ruta, antes del controlador, en `src/routes/auth.routes.js`:

```js
authRouter.post('/register', registerLimiter, register);
authRouter.post('/login', loginLimiter, login);
authRouter.post('/logout', logout);
```

Cada opción:

- `windowMs`: duración de la ventana. `limit`: peticiones permitidas por ventana
  y por cliente; la siguiente recibe `429`.
- `identifier`: nombre de la política que aparece en `RateLimit-Policy`.
- `standardHeaders: 'draft-8'`: envía `RateLimit` y `RateLimit-Policy` (el
  estándar IETF). `legacyHeaders: false` evita las antiguas `X-RateLimit-*`.
- `skipSuccessfulRequests`: descuenta las respuestas `1xx/2xx/3xx`, así que en
  `/login` solo cuentan los fallos (`4xx`/`5xx`).
- `message`: cuerpo JSON del `429`, con el mismo formato de error que el resto de
  la API.

Como el limiter va antes del controlador, la petición bloqueada no valida
credenciales ni ejecuta `bcrypt`: incluso con la contraseña correcta, la
petición 11 responde `429`.

### Casos de uso

**1. Ver las cabeceras.** Con `npm run dev` corriendo:

```bash
node -e "fetch('http://localhost:3000/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'nadie',password:'mala'})}).then(async r=>{console.log(r.status);[...r.headers].forEach(([k,v])=>console.log(k+': '+v));console.log(await r.text())})"
```

Salida esperada (resumida):

```http
401
content-type: application/json; charset=utf-8
ratelimit: "login"; r=9; t=900
ratelimit-policy: "login"; q=10; w=900; pk=:…:
```

- `r`: peticiones restantes en la ventana.
- `t`: segundos hasta que se reinicie el contador.
- `q` y `w`: cuota y ventana en segundos de la política.
- `pk`: la clave del cliente seudonimizada (base64 de los primeros 12 hex de su
  SHA-256). No es anonimización: con IPv4 el espacio es chico y se puede
  recuperar por fuerza bruta.

Ojo: en PowerShell, `curl` sin `.exe` es un alias de `Invoke-WebRequest` y no
acepta `-d`; por eso los ejemplos usan `node` o `curl.exe`.

**2. Provocar el `429`.** El caso 1 ya consumió un intento: reiniciá el
servidor (`Ctrl+C` y `npm run dev`) para partir de cero y ejecutá:

```bash
node -e "(async()=>{for(let i=1;i<=11;i++){const r=await fetch('http://localhost:3000/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'nadie',password:'mala'})});console.log(i,r.status)}})()"
```

Las primeras 10 respuestas son `401` y la 11 es `429`. Si después de eso
intentás con credenciales válidas, también recibís `429`: la cuota es por
cliente (IP, o subred /56 en IPv6), no por usuario.

**3. Ver el cuerpo y `Retry-After` del bloqueo.**

```bash
curl.exe -i -X POST -H "Content-Type: application/json" -d "{}" http://localhost:3000/api/auth/login
```

```http
HTTP/1.1 429 Too Many Requests
RateLimit: "login"; r=0; t=900
RateLimit-Policy: "login"; q=10; w=900; pk=:…:
Retry-After: 900
Content-Type: application/json; charset=utf-8

{"error":"Demasiados intentos de login. Probá de nuevo más tarde."}
```

`Retry-After` está en segundos: es lo que el frontend debe respetar antes de
reintentar.

**4. Un login exitoso no consume cuota.** Reiniciá el servidor para partir de
cero. Con tu usuario y contraseña reales, repetí 11 inicios de sesión correctos:
los 11 responden `200`. Después, un intento fallido sigue respondiendo `401`, no
`429`.

**5. Reiniciar el contador.** Reiniciá el servidor (`Ctrl+C` y `npm run dev`) y
repetí el punto 2: vuelve a empezar de cero. Es el efecto del `MemoryStore`;
también significa que un reinicio en producción borra los bloqueos.

**6. Prueba automática.** El comportamiento está cubierto por
`test/rateLimit.test.js`:

```bash
node --env-file-if-exists=.env --test test/rateLimit.test.js
```

**7. Suite completa.**

```bash
npm test
```

Debe terminar con `fail 0`.

### Buenas prácticas

- **`trust proxy` es la trampa más común.** Detrás de Nginx, un balanceador o
  Heroku, `req.ip` es la IP del proxy: sin configurar nada, todos los clientes
  comparten cuota y un atacante bloquea a todos. Se corrige con
  `app.set('trust proxy', <cantidad exacta de saltos>)`, por ejemplo `1` con un
  solo proxy. No uses `trust proxy = true`: esta versión lo detecta y lanza
  `ERR_ERL_PERMISSIVE_TRUST_PROXY` en cada petición (el cliente recibe `500`).
  Tampoco configures saltos de más: si el servidor está expuesto directamente,
  un cliente podría falsificar `X-Forwarded-For` y elegir su propia clave.
- **`MemoryStore` no sirve para varias instancias.** Cuesta memoria por proceso,
  se reinicia con el servidor y cada nodo cuenta por separado. Con más de un
  proceso o *serverless*, usá un store compartido (por ejemplo
  `rate-limit-redis`).
- **No bloquees por cuenta solamente.** Si la clave es el username, cualquiera
  puede dejar fuera a un usuario legítimo intentando con su nombre. IP (o IP +
  cuenta) es el equilibrio habitual.
- **El frontend debe manejar el `429`** y respetar `Retry-After`; si no, el
  usuario ve errores sin explicación.
- **Los límites se ajustan al uso real**: demasiado bajos generan `429` a
  usuarios legítimos (por ejemplo, una oficina detrás de una sola IP pública).
- **Un ataque distribuido no se frena solo con esto**: muchas IP hacen que cada
  una tenga su cuota. Complementá con monitoreo, MFA y contraseñas fuertes.
- **Registrá y monitoreá los `429`**: un pico es una señal de ataque o de un
  límite mal calibrado (capítulo 4).

---

## 3. CORS

### Qué es

CORS (*Cross-Origin Resource Sharing*) es el mecanismo por el que una API
declara qué orígenes pueden leer sus respuestas desde JavaScript en el navegador.
Un origen es la combinación de esquema, host y puerto: `http://localhost:5173` y
`http://localhost:3000` son orígenes distintos aunque compartan host.

No es un firewall: el navegador envía la petición y el servidor responde; CORS
solo decide si el JavaScript de la página puede **leer** esa respuesta. `curl`,
Postman o un servidor no aplican CORS.

Cuando la petición no es simple (por ejemplo, con `Content-Type:
application/json`), el navegador manda antes un `OPTIONS` de *preflight* y espera
la autorización.

### Instalación

```bash
npm install cors
```

Instalado: `cors@^2.8.6`.

### Para qué sirve

El frontend (Vite en `http://localhost:5173`) necesita dos cosas:

1. **Leer la respuesta** de `http://localhost:3000`. Sin CORS, el navegador la
   bloquea y en la consola aparece `blocked by CORS policy`.
2. **Enviar y recibir la cookie de sesión.** Como la autenticación es una cookie
   `httpOnly`, el servidor debe permitir credenciales y el cliente debe pedirlas
   con `credentials: 'include'`.

| Cabecera | Ejemplo | Función |
|---|---|---|
| `Access-Control-Allow-Origin` | `http://localhost:5173` | Autoriza ese origen (nunca `*` con cookies) |
| `Access-Control-Allow-Credentials` | `true` | Permite la cookie |
| `Access-Control-Allow-Methods` | `GET,HEAD,PUT,PATCH,POST,DELETE` | Métodos del preflight |
| `Access-Control-Allow-Headers` | `content-type` | Headers permitidos en el preflight |
| `Vary` | `Origin` | Evita que una caché sirva la respuesta de otro origen |

Lo que **no** hace: no autentica, no autoriza y no protege contra CSRF. Solo
controla qué JavaScript de un navegador puede leer.

### Implementación

`src/middlewares/cors.js`:

```js
import cors from 'cors';

export const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsMiddleware = cors({
  origin: allowedOrigins,
  credentials: true,
});
```

`src/app.js`, antes de las rutas:

```js
import { corsMiddleware } from './middlewares/cors.js';
// …
app.use(helmet());
app.use(corsMiddleware);
```

Y en `.env.example`:

```bash
CORS_ORIGINS=http://localhost:5173
```

Detalles:

- `origin` acepta una lista: el middleware refleja el origen solo si coincide. Con
  `credentials: true` el `Access-Control-Allow-Origin` debe ser el origen exacto;
  `*` es inválido.
- `credentials: true` habilita la cookie de sesión en la respuesta.
- El orden importa: si CORS va después de `app.use('/api', requireAuth, …)`, el
  `OPTIONS` de preflight a una ruta protegida recibe `401` y el navegador nunca
  manda la petición real.

### Casos de uso

**1. Ver el eco del origen.** Con `npm run dev` corriendo:

```bash
curl.exe -s -i -H "Origin: http://localhost:5173" http://localhost:3000/health | Select-String "Access-Control|Vary"
```

```http
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Allow-Credentials: true
```

**2. Preflight de una ruta protegida.** Sin cookie:

```bash
curl.exe -s -i -X OPTIONS -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: GET" http://localhost:3000/api/products | Select-String "HTTP/|Access-Control|Vary"
```

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin, Access-Control-Request-Headers
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
```

El `204` (y no `401`) confirma que el preflight se responde antes de
`requireAuth`.

**3. Origen no permitido.**

```bash
curl.exe -s -i -H "Origin: http://localhost:9999" http://localhost:3000/health | Select-String "Access-Control"
```

No aparece `Access-Control-Allow-Origin`. El servidor respondió `200`, pero el
navegador no deja leer esa respuesta. (`Access-Control-Allow-Credentials: true`
puede seguir apareciendo: sin `Allow-Origin` no habilita nada.)

**4. Desde el frontend.** Con Vite en `:5173`:

```js
await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ username, password }),
});

const response = await fetch('http://localhost:3000/api/products', {
  credentials: 'include',
});
```

Sin `credentials: 'include'` la cookie no se envía ni se guarda, aunque el
servidor tenga `credentials: true`.

**5. Agregar otro origen.** Por ejemplo, `npm run preview` de Vite usa `:4173`.
Sin tocar código, en `.env`:

```bash
CORS_ORIGINS=http://localhost:5173,http://localhost:4173
```

Reiniciá el servidor para que tome la variable.

**6. Suite completa.**

```bash
npm test
```

Debe terminar con `fail 0`.

### Buenas prácticas

- **Nunca `origin: '*'` ni `origin: true` con `credentials: true`.** Reflejar
  cualquier origen deja la API legible por cualquier sitio con la sesión del
  usuario.
- **La allowlist se escribe exacta**: esquema, host y puerto, sin barra final ni
  rutas. `http://localhost:5173/` no coincide con `http://localhost:5173`.
- **CORS no es autenticación.** No frena `curl`, Postman, scripts del servidor ni
  SSRF; la cookie `SameSite` y la validación del token siguen siendo la defensa.
- **Montá CORS antes de las rutas protegidas.** El preflight viaja sin cookies; si
  pide sesión, el navegador no llega nunca al `POST`.
- **Producción en otro sitio:** si el frontend está en otro dominio registrable,
  la cookie `SameSite=Strict` no viaja; hay que pasar a `SameSite=None; Secure`
  con HTTPS. Con subdominios del mismo dominio, `Strict` sigue funcionando.
- **Caché y preflight:** `Vary: Origin` evita respuestas cruzadas en cachés. Si
  hay muchos `OPTIONS`, se pueden cachear con `maxAge`.
- **Helmet y CORS no compiten:** `Cross-Origin-Resource-Policy: same-origin`
  afecta a recursos embebidos (imágenes, scripts), no a un `fetch` con CORS.

---

## 4. Logging

### Qué es

Loguear es dejar un registro de lo que pasó. Acá se separan dos cosas:

- **Log de acceso HTTP**: una línea por petición (método, ruta, estado, tiempo).
  Lo genera Morgan.
- **Log de aplicación**: eventos y errores con nivel. Lo maneja Winston.

Winston ordena los niveles de más a menos grave: `error`, `warn`, `info`,
`http`, `verbose`, `debug`, `silly`. El nivel configurado es el mínimo que se
escribe: con `http` entran `error`, `warn`, `info` y `http`; con `info`, los
accesos dejan de registrarse.

`console.log` no alcanza en producción: no tiene niveles, ni formato estable,
ni destino configurable.

### Instalación

```bash
npm install winston morgan
```

Instalado: `winston@^3.19.0` y `morgan@^1.12.1`.

### Para qué sirve

- **Diagnosticar** un `500` sin reproducirlo: método, ruta y stack.
- **Detectar ataques**: un pico de `401` o `429` (capítulo 2) se ve en los
  accesos.
- **Operar en producción**: una línea JSON por evento, lista para que Docker,
  systemd o el proveedor la indexe y alerte.

No reemplaza al monitoreo: es la materia prima.

### Implementación

`src/config/logger.js`:

```js
import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';
const isSilent = process.env.LOG_LEVEL === 'silent';
const level = isSilent ? 'http' : (process.env.LOG_LEVEL ?? 'http');

const developmentFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  ...(process.stdout.isTTY ? [winston.format.colorize()] : []),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level: label, message, stack, ...meta }) => {
    const detail = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${label}: ${message}${detail}${stack ? `\n${stack}` : ''}`;
  }),
);

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const logger = winston.createLogger({
  level,
  silent: isSilent,
  format: isProduction ? productionFormat : developmentFormat,
  transports: [new winston.transports.Console()],
});
```

- El transporte `Console` escribe en **stdout**; no hay archivos.
- El color se agrega solo si la salida es una terminal: redirigir a un archivo
  no mete códigos ANSI.
- `LOG_LEVEL` define el nivel (default `http`); `silent` apaga todo.
- En producción el formato es JSON; en desarrollo, una línea legible.

`src/middlewares/httpLogger.js`:

```js
import morgan from 'morgan';
import { logger } from '../config/logger.js';

const format =
  process.env.NODE_ENV === 'production'
    ? 'combined'
    : ':method :url :status :response-time ms';

export const httpLogger = morgan(format, {
  stream: { write: (line) => logger.http(line.trim()) },
  skip: (req) => logger.silent || req.path === '/health',
});
```

Morgan no lee body, cookies ni `Authorization`: solo lo que muestra el formato.
`combined` agrega IP, fecha y user-agent.

En `src/app.js` va **primero**, antes de Helmet y las rutas, para registrar
también los `401`, los `404` y los preflight de CORS:

```js
app.use(httpLogger);
```

En `src/middlewares/errorHandler.js`, los `5xx` se registran con contexto:

```js
logger.error(err, { method: req.method, url: req.originalUrl });
```

Los `4xx` no se duplican: ya están en el log de acceso. Nunca se registra el
body, las cookies ni el objeto crudo de Sequelize (puede incluir SQL y sus
parámetros). En `src/index.js`, los mensajes de arranque y cierre también pasan
por el logger.

Configuración:

```bash
# .env.example
LOG_LEVEL=http
```

```bash
# .env.test
LOG_LEVEL=silent
```

```json
"test": "node --env-file-if-exists=.env --env-file-if-exists=.env.test --test"
```

El último archivo gana, así los tests apagan el logger sin cambiar código.

### Casos de uso

**1. Una línea por petición.** Con `npm run dev`:

```bash
curl.exe -s -o NUL http://localhost:3000/api/products
```

```text
13:58:55 http: GET /api/products 401 0.490 ms
```

**2. `/health` no ensucia.** El chequeo se repite cada pocos segundos y no
genera línea (lo salta `skip`).

**3. Un `404`.**

```bash
curl.exe -s -o NUL http://localhost:3000/no-existe
```

```text
13:58:55 http: GET /no-existe 404 0.333 ms
```

(`/api/no-existe` da `401`, no `404`: `requireAuth` corre antes.)

**4. La contraseña no aparece.**

```bash
curl.exe -s -o NUL -X POST -H "Content-Type: application/json" -d '{"username":"nadie","password":"ClaveSecreta123"}' http://localhost:3000/api/auth/login
```

La línea registra `POST /api/auth/login 401`, pero no `ClaveSecreta123` ni el
resto del body.

**5. El nivel filtra.** Reiniciá con otro nivel:

```powershell
$env:LOG_LEVEL="info"; npm run dev
```

Aparecen los mensajes de arranque pero **no** los accesos: `http` es menos grave
que `info`. Para volver:

```powershell
Remove-Item Env:\LOG_LEVEL
```

**6. JSON en producción.**

```powershell
$env:NODE_ENV="production"; npm start
```

```json
{"level":"http","message":"::1 - - [30/Oct/2026:16:59:01 +0000] \"GET /api/products HTTP/1.1\" 401 26 \"-\" \"curl/8.21.0\"","timestamp":"2026-10-30T16:59:01.146Z"}
```

```powershell
Remove-Item Env:\NODE_ENV
```

En producción la cookie es `Secure`: para probar el login haría falta HTTPS.

**7. La suite queda muda.** `npm test` no escribe una línea por request y sigue
terminando con `fail 0`.

### Opcional: logs a archivo

Primero, sin rotación y sin dependencias extra:

```js
transports: [
  new winston.transports.Console(),
  new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  new winston.transports.File({ filename: 'logs/app.log' }),
],
```

Winston crea la carpeta `logs/` y `*.log` ya está en `.gitignore`. El problema:
el archivo crece sin límite. Para producción, rotación diaria y por tamaño:

```bash
npm install winston-daily-rotate-file
```

```js
import DailyRotateFile from 'winston-daily-rotate-file';

new DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
});
```

En contenedores, dejá también `Console`: la plataforma recolecta stdout y el
archivo muere con el contenedor.

### Buenas prácticas

- **Nunca loguees body, cookies, `Authorization`, contraseñas ni tokens.** Si un
  dato no lo pondrías en un ticket, no va al log.
- **Tampoco secretos en la URL**: el log de acceso guarda el query string.
- **No loguees el error crudo de Sequelize**: `sql` y `parameters` pueden
  exponer datos.
- **La IP es un dato personal**: definí cuánto tiempo conservás los logs.
- **Niveles con criterio**: `error` para `5xx`, `warn` para lo anómalo, `http`
  para accesos y `debug` solo en desarrollo.
- **JSON en producción**: permite filtrar por campo; concatenar strings no.
- **Rotación obligatoria si escribís a archivo**, o el disco se llena.
- **Correlación**: un `X-Request-Id` por petición une el acceso con su error.
- Detrás de un proxy, `:remote-addr` necesita `trust proxy` (capítulo 2).
