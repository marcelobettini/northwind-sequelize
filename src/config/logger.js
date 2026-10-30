// Logger de la aplicación. Todo sale por stdout: en desarrollo se lee en la
// terminal y en producción lo recolecta la plataforma (Docker, systemd, etc.).
import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

// En los tests no queremos cientos de líneas de log. `silent` apaga la salida
// sin desmontar el middleware ni cambiar el código de la aplicación.
const isSilent = process.env.LOG_LEVEL === 'silent';

// Niveles npm (de más a menos grave): error, warn, info, http, verbose, debug,
// silly. El default es `http` para que los accesos de Morgan se registren; con
// `info` se perderían, porque `http` es menos grave que `info`.
const level = isSilent ? 'http' : (process.env.LOG_LEVEL ?? 'http');

// Desarrollo: una línea legible con hora, nivel y, si hay, metadatos. El color
// solo se agrega en una terminal; si la salida se redirige a un archivo, se
// omiten los códigos ANSI.
const developmentFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  ...(process.stdout.isTTY ? [winston.format.colorize()] : []),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level: label, message, stack, ...meta }) => {
    const detail = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    const trace = stack ? `\n${stack}` : '';
    return `${timestamp} ${label}: ${message}${detail}${trace}`;
  }),
);

// Producción: una línea JSON por evento, fácil de parsear e indexar.
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
