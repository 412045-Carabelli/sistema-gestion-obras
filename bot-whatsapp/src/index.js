const express = require('express');
const { iniciarSesion, registrarWebhook } = require('./waha-client');
const { manejarMensaje } = require('./bot');
const { iniciarCron, enviarNotificacionesVencimiento } = require('./notificaciones');
const { PORT } = require('./config');

const app = express();
app.use(express.json({ limit: '10mb' }));

const mensajesProcesados = new Map();
function yaProcessado(msgId) {
  if (!msgId) return false;
  if (mensajesProcesados.has(msgId)) return true;
  mensajesProcesados.set(msgId, Date.now());
  const ahora = Date.now();
  for (const [id, ts] of mensajesProcesados) {
    if (ahora - ts > 10000) mensajesProcesados.delete(id);
  }
  return false;
}

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  try {
    const evento = req.body;
    if (evento.event !== 'message') return;

    const payload = evento.payload;
    if (!payload) return;

    if (yaProcessado(payload.id)) return;

    if (payload.fromMe) return;
    if (payload.chatId?.endsWith('@g.us')) return;
    if (payload.from?.endsWith('@g.us')) return;
    if (payload.from === 'status@broadcast') return;
    if (payload.chatId === 'status@broadcast') return;

    const chatId = payload.chatId || payload.from;
    const texto  = payload.body || payload.text || '';
    const tipo   = payload.type || payload?._data?.type || 'unknown';

    // Log completo si es media para diagnóstico
    if (payload.hasMedia || ['voice','audio','ptt'].includes(tipo)) {
      console.log('[webhook] MEDIA payload:', JSON.stringify({
        id: payload.id,
        type: tipo,
        hasMedia: payload.hasMedia,
        mediaUrl: payload.mediaUrl,
        media: payload.media,
        mimetype: payload._data?.mimetype,
      }));
    } else {
      console.log('[webhook] chatId:', chatId, '| type:', tipo, '| texto:', texto.slice(0, 80));
    }

    await manejarMensaje(chatId, texto, payload);
  } catch (err) {
    console.error('[webhook] Error:', err.message);
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/notificar-ahora', async (req, res) => {
  res.json({ ok: true });
  try { await enviarNotificacionesVencimiento(); } catch (err) {
    console.error('[notificar-ahora] Error:', err.message);
  }
});

async function arrancar() {
  app.listen(PORT, () => console.log(`[bot] Escuchando en http://0.0.0.0:${PORT}`));
  await new Promise(r => setTimeout(r, 5000));
  await iniciarSesion();
  iniciarCron();
  console.log('[bot] Listo — modo IA activo.');
}

arrancar().catch(err => { console.error('[bot] Error fatal:', err); process.exit(1); });
