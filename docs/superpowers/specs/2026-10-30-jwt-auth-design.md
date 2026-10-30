# Autenticación JWT con cookie segura

## Intención

Cerrar la API: solo un usuario autenticado puede consumir `/api/*`. Los únicos
endpoints públicos son `GET /health`, el registro y el login. El token viaja en
una cookie `httpOnly`, no en el body ni en `localStorage`.

## Decisiones

- **Usuarios en MySQL**, tabla `users` (ya creada):
  `UserID`, `Username`, `Email`, `PasswordHash`, `PasswordChangedAt`,
  `IsActive`, `CreatedAt`, `UpdatedAt`.
- **Hash:** bcryptjs, 10 rondas. `PasswordHash` (60 caracteres) nunca sale en
  una respuesta.
- **JWT:** `jsonwebtoken`; payload `{ sub: String(UserID) }`; vencimiento desde
  `JWT_EXPIRES_IN_SECONDS` (43200 s = 12 h en `.env`). La duración se maneja
  siempre en **segundos**; la cookie convierte a milisegundos una sola vez.
- **Cookie:** nombre `access_token`, `httpOnly`, `sameSite=strict`,
  `secure` cuando `NODE_ENV=production`, `path=/`, `maxAge` (ms) derivado de
  `JWT_EXPIRES_IN_SECONDS`.
- **Registro público sin auto-login:** `POST /api/auth/register` crea la cuenta
  y devuelve `201`; la sesión se inicia recién con `/login`. Sin `/me`, sin
  refresh token, sin roles.
- **Sin consulta a la base por request:** `requireAuth` solo verifica la firma.
  Consecuencia asumida: desactivar un usuario no invalida su token vigente.
- **`PasswordChangedAt`** se setea al registrar y se usará en la feature de
  reset de contraseña.

## Endpoints

| Endpoint | Acceso | Respuesta |
|---|---|---|
| `GET /health` | Público | `200 { "status": "ok" }` |
| `POST /api/auth/register` | Público | `201 { user: { UserID, Username, Email } }` |
| `POST /api/auth/login` | Público | `200 { user: { UserID, Username, Email } }` + cookie |
| `POST /api/auth/logout` | Público | `204`, borra la cookie |
| Resto de `/api/*` | Requiere cookie | `401 { "error": "No autenticado" }` |

Registro recibe `{ username, email, password }`, normaliza email a minúsculas y
valida: username de 3–50 caracteres (`[a-zA-Z0-9._-]`), email básico de hasta 255
y password de 8–72 bytes (límite de bcrypt). Duplicados → `409`; datos inválidos
→ `400`. La password se hashea con bcrypt (10 rondas) y `PasswordHash` nunca sale
en la respuesta. La unicidad la garantiza la base y se captura la carrera de dos
registros simultáneos.

Login recibe `{ username, password }`, compara con `bcrypt.compare` y usa un
hash dummy cuando el usuario no existe para no filtrar tiempos. Credenciales
inválidas o usuario inactivo → `401 { "error": "Credenciales inválidas" }`.
Body inválido → `400`. JSON malformado → `400 { "error": "JSON inválido" }`.

## Alternativas consideradas

- **Token en `localStorage`:** descartado; expuesto a XSS y no es cookie segura.
- **Sesiones en base:** descartado por alcance; JWT firmado es suficiente.
- **Credenciales en `.env`:** descartado cuando se decidió crear `users`.
- **Reset tokens en columnas de `users`:** descartado; irá en tabla aparte
  `passwordresettokens` cuando se implemente esa feature.

## Archivos

- `src/config/auth.js` — valida `JWT_SECRET`, normaliza `JWT_EXPIRES_IN_SECONDS`
  y expone nombre/opciones de cookie.
- `src/models/user.model.js` — modelo `User`; `defaultScope` excluye
  `PasswordHash`.
- `src/services/auth.service.js` — `registerUser`, `authenticate`, `issueToken`,
  `verifyToken`.
- `src/middlewares/auth.js` — `requireAuth`.
- `src/controllers/auth.controller.js` — `register`, `login`, `logout`.
- `src/routes/auth.routes.js`.
- Modificados: `src/app.js`, `src/middlewares/errorHandler.js`,
  `src/models/index.js`, `db-schema/northwind.sql`, `package.json`.
- Tests: `test/auth.test.js`, `test/health.test.js`, helper
  `test/helpers/auth.js`; se actualizan los 5 tests HTTP existentes.

## Fuera de alcance

Verificación de email, CAPTCHA, recuperación de contraseña, rate limiting de
registro y login, CSRF token (la API es de solo lectura y `SameSite=Strict`
cubre el caso actual), roles y revocación de tokens.
