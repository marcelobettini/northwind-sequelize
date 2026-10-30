// CORS: qué orígenes del navegador pueden leer las respuestas de esta API.
// Sin esto, el frontend en otro origen (Vite en :5173) recibe un error de CORS
// aunque el servidor haya respondido correctamente.
import cors from 'cors';

// Allowlist explícita por variable de entorno. Nunca '*' cuando la cookie de
// sesión viaja en la petición: el navegador rechaza esa combinación.
export const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsMiddleware = cors({
  // El middleware refleja el origen solo si está en la lista.
  origin: allowedOrigins,
  // Permite que el navegador envíe y acepte la cookie httpOnly de sesión.
  credentials: true,
});
