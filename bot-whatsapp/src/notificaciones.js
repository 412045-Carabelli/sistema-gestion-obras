const cron = require('node-cron');
const { enviarMensaje } = require('./waha-client');
const api = require('./sgo-api');
const fmt = require('./formatos');
const { NUMEROS_NOTIFICACIONES, DIAS_VENCIMIENTO, CRON_NOTIFICACIONES } = require('./config');

async function enviarNotificacionesVencimiento() {
  if (NUMEROS_NOTIFICACIONES.length === 0) {
    console.log('[notif] Sin números configurados para notificaciones automáticas.');
    return;
  }

  console.log(`[notif] Consultando tareas próximas (${DIAS_VENCIMIENTO} días)...`);

  let data;
  try {
    data = await api.tareasProximas(DIAS_VENCIMIENTO);
  } catch (err) {
    console.error('[notif] Error al consultar tareas:', err.message);
    return;
  }

  const obras = data.tareasObras || [];
  const agendas = data.tareasAgendas || [];
  const total = obras.length + agendas.length;

  if (total === 0) {
    console.log('[notif] Sin tareas por vencer. No se envían notificaciones.');
    return;
  }

  const mensaje = fmt.fmtTareasProximas(data, DIAS_VENCIMIENTO);

  for (const numero of NUMEROS_NOTIFICACIONES) {
    const chatId = numero.includes('@') ? numero : `${numero}@c.us`;
    try {
      await enviarMensaje(chatId, `🔔 *Recordatorio SGO*\n\n${mensaje}`);
      console.log(`[notif] Enviado a ${chatId}`);
    } catch (err) {
      console.error(`[notif] Error enviando a ${chatId}:`, err.message);
    }
  }
}

function iniciarCron() {
  console.log(`[notif] Cron de notificaciones: "${CRON_NOTIFICACIONES}"`);
  cron.schedule(CRON_NOTIFICACIONES, async () => {
    console.log('[notif] Ejecutando cron de vencimientos...');
    await enviarNotificacionesVencimiento();
  });
}

module.exports = { iniciarCron, enviarNotificacionesVencimiento };
