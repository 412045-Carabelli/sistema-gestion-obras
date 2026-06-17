const axios = require('axios');
const { WAHA_URL, WAHA_SESSION, WAHA_API_KEY } = require('./config');

const waha = axios.create({
  baseURL: WAHA_URL,
  timeout: 15000,
  headers: WAHA_API_KEY ? { 'X-Api-Key': WAHA_API_KEY } : {},
});

async function enviarMensaje(chatId, texto) {
  console.log('[waha] enviando a', chatId, ':', texto.slice(0, 60));
  try {
    await waha.post('/api/sendText', { session: WAHA_SESSION, chatId, text: texto });
    console.log('[waha] enviado OK');
  } catch (err) {
    console.error('[waha] error enviando:', err.response?.status, err.response?.data || err.message);
  }
}

/**
 * Descarga el audio desde la URL que trae el payload de WAHA.
 * WAHA WEBJS retorna URLs con localhost — las reemplazamos por el hostname interno (waha:3000).
 */
async function descargarMediaUrl(mediaUrl) {
  // Reemplazar localhost/127.0.0.1 por el hostname interno de WAHA
  const url = mediaUrl
    .replace('http://localhost:3000', WAHA_URL)
    .replace('http://127.0.0.1:3000', WAHA_URL);

  console.log('[waha] descargando media:', url);

  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
    headers: WAHA_API_KEY ? { 'X-Api-Key': WAHA_API_KEY } : {},
  });

  return Buffer.from(res.data);
}

async function iniciarSesion() {
  try {
    await waha.post('/api/sessions/start', { name: WAHA_SESSION });
    console.log(`[WAHA] Sesión "${WAHA_SESSION}" iniciada`);
  } catch (e) {
    console.log(`[WAHA] Sesión ya existente o error al iniciar: ${e.message}`);
  }
}

async function registrarWebhook(webhookUrl) {
  try {
    await waha.put(`/api/sessions/${WAHA_SESSION}`, {
      webhooks: [{ url: webhookUrl, events: ['message'] }],
    });
    console.log(`[WAHA] Webhook registrado: ${webhookUrl}`);
  } catch (e) {
    console.error(`[WAHA] Error registrando webhook: ${e.message}`);
  }
}

module.exports = { enviarMensaje, descargarMediaUrl, iniciarSesion, registrarWebhook };
