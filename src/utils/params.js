// Valida un parámetro de ruta que debe ser un ID numérico.
// Devuelve null ante cualquier forma no canónica ("1abc", "1.0", "01", "0",
// negativos o fuera del rango seguro). Así MySQL no convierte el texto a
// número y no resuelve una fila que el cliente no pidió.
export function parseIntegerId(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}
