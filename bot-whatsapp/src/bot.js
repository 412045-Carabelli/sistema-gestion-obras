const { enviarMensaje, descargarMediaUrl } = require('./waha-client');
const { procesarMensaje, limpiarHistorial } = require('./agent');

const { transcribirAudio } = require('./transcriber');
const { NUMEROS_AUTORIZADOS, GROQ_API_KEY } = require('./config');

function esAutorizado(chatId) {
  if (NUMEROS_AUTORIZADOS.length === 0) return true;
  const numero = chatId.replace(/@c\.us$/, '').replace(/@g\.us$/, '').replace(/@lid$/, '');
  return NUMEROS_AUTORIZADOS.includes(numero) || NUMEROS_AUTORIZADOS.includes(chatId);
}

function esAudio(payload) {
  const tipo = payload?.type || payload?._data?.type || '';
  return tipo === 'voice' || tipo === 'audio' || tipo === 'ptt';
}

async function manejarMensaje(chatId, texto, payload = null) {
  if (!esAutorizado(chatId)) return;

  let mensajeTexto = (texto || '').trim();

  if (['reset', 'limpiar', 'nueva consulta'].includes(mensajeTexto.toLowerCase())) {
    limpiarHistorial(chatId);
    await enviarMensaje(chatId, '🗑️ Conversación reiniciada. ¿En qué te puedo ayudar?');
    return;
  }

  // Procesar audio usando la URL del payload
  if (esAudio(payload)) {
    if (!GROQ_API_KEY) {
      await enviarMensaje(chatId, '⚠️ Los audios no están habilitados (falta GROQ_API_KEY).');
      return;
    }
    const mediaUrl = payload?.media?.url;
    if (!mediaUrl) {
      await enviarMensaje(chatId, '❌ No pude obtener la URL del audio.');
      return;
    }
    const mimetype = payload?.media?.mimetype || 'audio/ogg';
    try {
      await enviarMensaje(chatId, '🎤 Transcribiendo audio...');
      const buffer = await descargarMediaUrl(mediaUrl);
      mensajeTexto = await transcribirAudio(buffer, mimetype);
      if (!mensajeTexto) {
        await enviarMensaje(chatId, '❌ No pude transcribir el audio. Enviá un mensaje de texto.');
        return;
      }
      await enviarMensaje(chatId, `🎤 _"${mensajeTexto}"_`);
    } catch (err) {
      console.error('[bot] Error transcribiendo audio:', err.message);
      await enviarMensaje(chatId, '❌ Error al procesar el audio. Intentá con texto.');
      return;
    }
  }

  if (!mensajeTexto) return;

  console.log(`[bot] ${chatId}: ${mensajeTexto.slice(0, 100)}`);

  try {
    const respuesta = await procesarMensaje(chatId, mensajeTexto);
    await enviarMensaje(chatId, respuesta);
  } catch (err) {
    console.error('[bot] Error procesando mensaje:', err.message);

    // Si el modelo falló generando la tool call (bug de acentos/formato) → reintentar sin historial
    if (err.message?.includes('tool_use_failed') || err.message?.includes('Failed to call a function')) {
      console.log('[bot] Reintentando sin historial por tool_use_failed...');
      limpiarHistorial(chatId);
      try {
        const respuesta = await procesarMensaje(chatId, mensajeTexto);
        await enviarMensaje(chatId, respuesta);
        return;
      } catch (err2) {
        console.error('[bot] Error en retry:', err2.message);
      }
    }

    await enviarMensaje(chatId, '❌ Error al consultar SGO. Intentá de nuevo.\n\nEscribí *reset* para limpiar la conversación.');
  }
}

module.exports = { manejarMensaje };
