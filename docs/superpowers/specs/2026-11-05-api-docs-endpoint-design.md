# Documentación OpenAPI servida por la aplicación

## Intención

Servir `src/docs/api-spec.yml` desde la propia API: Swagger UI interactivo en
desarrollo y el contrato crudo descargable en cualquier entorno. La
documentación no debe pasar por `requireAuth` ni mezclarse con la carpeta
`docs/` que usa Superpowers.

## Decisiones

- **UI:** `GET /api-docs` con `swagger-ui-express`. Se habilita cuando
  `NODE_ENV !== 'production'` o cuando `ENABLE_API_DOCS=true`.
- **Spec crudo:** `GET /openapi.yaml` siempre disponible; el proyecto no se
  trata como API privada. Devuelve el YAML tal cual y Swagger UI lo consume
  desde el navegador.
- **Ubicación:** ambas rutas se registran en `src/app.js` antes de
  `app.use('/api', requireAuth, apiRouter)`, así que quedan públicas y no
  heredan la sesión.
- **CSP:** `helmet()` con sus directivas por defecto bloquea Swagger UI. Las
  rutas de documentación usan un `helmet` propio con `scriptSrc` y `styleSrc`
  incluyendo `'unsafe-inline'`, `imgSrc` incluyendo `data:` y
  `upgradeInsecureRequests: null`. Se registran antes del `helmet()` global
  para que este último no las sobrescriba; el resto de la app conserva el CSP
  estricto.
- **Ruta del archivo:** se resuelve con
  `fileURLToPath(new URL('./docs/api-spec.yml', import.meta.url))`, sin
  depender del directorio de trabajo.
- **Sin dependencias nuevas:** el servidor no parsea el YAML; lo hace Swagger
  UI en el cliente.
- **Configuración:** `ENABLE_API_DOCS` se documenta en `.env.example` como
  opt-in para producción. No se agrega al `.env` local.

## Endpoints

| Endpoint | Disponibilidad | Respuesta |
|---|---|---|
| `GET /api-docs` | Desarrollo o `ENABLE_API_DOCS=true` | Swagger UI |
| `GET /api-docs/*` | Igual que la UI | Assets estáticos de Swagger UI |
| `GET /openapi.yaml` | Siempre | Contrato OpenAPI en YAML |

## Fuera de alcance

- Autenticar o proteger la documentación.
- Generar o modificar el contrato (`src/docs/api-spec.yml`).
- Servir la documentación desde `/api`.
- Cambiar el CSP del resto de la aplicación.

## Verificación

- `npm test` debe seguir pasando.
- Con el servidor en desarrollo: `GET /api-docs` responde `200` y
  `GET /openapi.yaml` devuelve el YAML.
- Con `NODE_ENV=production` y sin `ENABLE_API_DOCS`: `GET /api-docs` responde
  `404`, mientras `GET /openapi.yaml` sigue respondiendo `200`.
