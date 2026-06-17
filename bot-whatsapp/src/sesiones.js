/**
 * Estado de conversación por número de teléfono.
 * Se guarda en memoria (se limpia al reiniciar el bot).
 *
 * Estructura de cada sesión:
 * {
 *   paso: string,         // dónde está en el flujo
 *   contexto: object,     // datos acumulados (tipo elegido, lista de resultados, etc.)
 *   ultimaActividad: Date
 * }
 */
const sesiones = new Map();

const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos de inactividad

function obtener(chatId) {
  limpiarViejas();
  return sesiones.get(chatId) || null;
}

function guardar(chatId, datos) {
  sesiones.set(chatId, { ...datos, ultimaActividad: new Date() });
}

function limpiar(chatId) {
  sesiones.delete(chatId);
}

function limpiarViejas() {
  const ahora = new Date();
  for (const [id, sesion] of sesiones) {
    if (ahora - sesion.ultimaActividad > TIMEOUT_MS) {
      sesiones.delete(id);
    }
  }
}

module.exports = { obtener, guardar, limpiar };
