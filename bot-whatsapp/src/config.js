module.exports = {
  WAHA_URL:        process.env.WAHA_URL        || 'http://waha:3000',
  API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://api-gateway:8080',
  WAHA_SESSION:    process.env.WAHA_SESSION    || 'default',
  WAHA_API_KEY:    process.env.WAHA_API_KEY    || '',
  PORT:            process.env.PORT            || 4000,

  // Groq — una sola key para chat + transcripción de audio
  GROQ_API_KEY:      process.env.GROQ_API_KEY      || '',
  GROQ_MODEL:        process.env.GROQ_MODEL        || 'llama-3.1-8b-instant',
  GROQ_WHISPER_MODEL: process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo',

  NUMEROS_AUTORIZADOS: process.env.NUMEROS_AUTORIZADOS
    ? process.env.NUMEROS_AUTORIZADOS.split(',').map(n => n.trim())
    : [],

  NUMEROS_NOTIFICACIONES: process.env.NUMEROS_NOTIFICACIONES
    ? process.env.NUMEROS_NOTIFICACIONES.split(',').map(n => n.trim())
    : [],

  DIAS_VENCIMIENTO:    parseInt(process.env.DIAS_VENCIMIENTO    || '7'),
  CRON_NOTIFICACIONES: process.env.CRON_NOTIFICACIONES          || '0 8 * * *',

  MAX_HISTORY_MESSAGES: parseInt(process.env.MAX_HISTORY_MESSAGES || '8'),
  HISTORY_TTL_MS:       parseInt(process.env.HISTORY_TTL_MS       || String(30 * 60 * 1000)),
};
