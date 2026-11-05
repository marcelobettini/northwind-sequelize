// Caché HTTP para el catálogo público. El catálogo cambia poco y es de solo
// lectura, así que clientes y proxies pueden reutilizar la respuesta durante
// un minuto. Express sigue enviando ETag: al vencer, un cliente puede
// revalidar con `If-None-Match` y recibir un 304 sin cuerpo.
export function publicCatalogCache(req, res, next) {
  res.set('Cache-Control', 'public, max-age=60');
  next();
}
