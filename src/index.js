// Punto de entrada del servidor.
// Se separa de app.js para que las pruebas puedan importar la aplicación sin
// abrir un puerto. Aquí se verifica la conexión y recién entonces se escucha.
import { app } from './app.js';
import { sequelize } from './config/database.js';

const port = Number(process.env.PORT) || 3000;

// Tiempo máximo de espera para que terminen las conexiones en curso.
// Pasado ese plazo se fuerza la salida: un proceso que no muere bloquea el
// reinicio del contenedor hasta que el orquestador lo mata.
const SHUTDOWN_TIMEOUT_MS = 10_000;

try {
  await sequelize.authenticate();
  console.log(`Conexión a la base de datos "${process.env.DB_NAME}" establecida`);

  const server = app.listen(port, () => {
    console.log(`API disponible en http://localhost:${port}/api`);
  });

  // Cierre ordenado: deja de aceptar conexiones, espera los requests en curso
  // y vacía el pool de MySQL antes de que el proceso termine.
  //
  // La aplicación funcionaría igual sin esto: ante SIGINT/SIGTERM Node muere
  // igual y el sistema operativo libera los sockets. La diferencia es que un
  // cierre abrupto corta los requests en vuelo (el cliente recibe un reset o
  // un 502 del proxy) y puede truncar logs pendientes.
  //
  // En producción la ventaja es concreta: en cada deploy o reinicio el
  // orquestador manda SIGTERM, y con este cierre los requests que ya estaban
  // en curso terminan de responder en lugar de perderse.
  let isShuttingDown = false;

  const shutdown = async (signal) => {
    // Si ya hay un cierre en curso, una segunda señal no lo reinicia.
    if (isShuttingDown) {
      console.log(`${signal} recibida, pero el cierre ya está en curso`);
      return;
    }
    isShuttingDown = true;
    console.log(`${signal} recibida: cerrando servidor...`);

    // Red de seguridad: si alguna conexión no termina, no dejamos el proceso
    // colgado. `unref` evita que este timer retrase la salida por sí mismo.
    const forceExit = setTimeout(() => {
      console.error(`El cierre no terminó en ${SHUTDOWN_TIMEOUT_MS} ms: se fuerza la salida`);
      server.closeAllConnections();
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    let exitCode = 0;

    try {
      // `server.close` deja de aceptar conexiones y avisa cuando terminaron.
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    } catch (error) {
      exitCode = 1;
      console.error('Error al cerrar el servidor HTTP:', error.message);
    }

    try {
      // Vacía el pool y cierra las conexiones con MySQL.
      await sequelize.close();
    } catch (error) {
      exitCode = 1;
      console.error('Error al cerrar la base de datos:', error.message);
    }

    clearTimeout(forceExit);

    // No usamos `process.exit(0)`: así el proceso termina solo cuando no le
    // quedan recursos pendientes y se alcanzan a vaciar los logs.
    process.exitCode = exitCode;
  };

  // SIGINT: Ctrl+C en la terminal.
  process.on('SIGINT', () => shutdown('SIGINT'));
  // SIGTERM: lo envía el sistema operativo o el orquestador (docker stop,
  // restart, deploy en Kubernetes).
  process.on('SIGTERM', () => shutdown('SIGTERM'));
} catch (error) {
  // Sin detalle de credenciales: solo el motivo del fallo.
  console.error('No se pudo conectar a la base de datos:', error.message);
  process.exitCode = 1;
}
