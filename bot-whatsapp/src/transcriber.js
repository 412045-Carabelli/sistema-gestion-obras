const Groq = require('groq-sdk');
const { GROQ_API_KEY, GROQ_WHISPER_MODEL } = require('./config');

let groq = null;
function getClient() {
  if (!groq) {
    if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY no configurada');
    groq = new Groq({ apiKey: GROQ_API_KEY });
  }
  return groq;
}

/**
 * Transcribe un Buffer de audio (OGG/Opus de WhatsApp) usando Groq Whisper.
 * @param {Buffer} audioBuffer
 * @param {string} mimeType
 * @returns {Promise<string>}
 */
async function transcribirAudio(audioBuffer, mimeType = 'audio/ogg') {
  const client = getClient();
  const file = await Groq.toFile(audioBuffer, 'audio.ogg', { type: mimeType });

  const transcription = await client.audio.transcriptions.create({
    file,
    model: GROQ_WHISPER_MODEL,
    language: 'es',
  });

  return transcription.text?.trim() || '';
}

module.exports = { transcribirAudio };
