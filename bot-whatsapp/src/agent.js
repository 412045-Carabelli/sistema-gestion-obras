const Groq = require('groq-sdk');
const { GROQ_API_KEY, GROQ_MODEL, MAX_HISTORY_MESSAGES, HISTORY_TTL_MS } = require('./config');
const { TOOLS, ejecutarTool } = require('./tools');

const SYSTEM_PROMPT = `Sos un asistente del Sistema de Gestión de Obras (SGO) de una empresa constructora argentina.
Tu rol es responder consultas sobre obras, clientes, proveedores y finanzas usando las herramientas disponibles.

REGLAS GENERALES:
- Respondés siempre en español rioplatense (vos, no tú).
- Respuestas concisas y formateadas para WhatsApp (negrita con *, listas con •, sin markdown avanzado).
- Montos en pesos argentinos: $1.234.567 (sin decimales para montos grandes).
- Fechas en formato DD/MM/AAAA.
- Nunca inventás datos — solo usás lo que devuelven las herramientas.

BÚSQUEDA POR TIPO DE ENTIDAD — CRÍTICO:
- "proveedor X", "saldo de X" (contexto pago/deuda) → buscar_proveedores PRIMERO.
- "cliente X", "lo que debe X" → buscar_clientes PRIMERO.
- "obra X" → buscar_obras PRIMERO.
- Sin contexto claro → buscá en los tres y preguntá cuál es.
- Un resultado → procedé directamente sin preguntar.
- Múltiples resultados → mostrá lista y preguntá.

INTERPRETACIÓN DE SALDOS:
- Saldo proveedor = lo que la empresa le DEBE al proveedor (viene en campo "saldo" de cuenta_corriente_proveedor).
- Saldo cliente = lo que el cliente le debe a la empresa.
- Siempre aclará el sentido al responder (ej: "le debés $X a este proveedor").

MODO DE OPERACIÓN — CRÍTICO:
- NUNCA narres tu plan ni expliques qué vas a hacer. Ejecutá las herramientas en silencio y respondé SOLO con el resultado final.
- NUNCA escribas frases como "Primero voy a buscar...", "Intentaré...", "Si no encuentro...". Eso NO es una respuesta válida.
- Si necesitás varios pasos → hacelos todos con tool_calls antes de responder al usuario.

RESILIENCIA — NUNCA te rindas en el primer intento:
- Si buscar_proveedores("Cornejo Martín") no devuelve nada → llamá tool con "Cornejo", luego "Martin", luego listá todos.
- Si el nombre tiene tilde/acento → llamá tool también sin tilde.
- Si buscaste en proveedores y no hay → preguntá: "¿Es proveedor, cliente u obra? No encontré coincidencias exactas."
- Si hay resultados pero ninguno es exacto → mostrá los más parecidos y preguntá: "¿Es alguno de estos?"
- Nunca respondas "no encontré nada" sin antes haber probado al menos 2 variantes del nombre.
- Si el usuario confirma un resultado de la lista → usá ese ID directamente sin volver a buscar.`;

const historiales = new Map();

function obtenerHistorial(chatId) {
  const ahora = Date.now();
  const entrada = historiales.get(chatId);
  if (entrada && ahora - entrada.lastActivity > HISTORY_TTL_MS) {
    historiales.delete(chatId);
    return [];
  }
  return entrada?.messages ? [...entrada.messages] : [];
}

function guardarHistorial(chatId, messages) {
  historiales.set(chatId, { messages: messages.slice(-MAX_HISTORY_MESSAGES), lastActivity: Date.now() });
}

setInterval(() => {
  const ahora = Date.now();
  for (const [chatId, entrada] of historiales) {
    if (ahora - entrada.lastActivity > HISTORY_TTL_MS) historiales.delete(chatId);
  }
}, 10 * 60 * 1000);

let client = null;
function getClient() {
  if (!client) {
    if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY no configurada');
    client = new Groq({ apiKey: GROQ_API_KEY });
  }
  return client;
}

function comprimirResultado(name, resultado) {
  const esListado = ['buscar_obras', 'buscar_clientes', 'buscar_proveedores'].includes(name);
  if (esListado && Array.isArray(resultado)) {
    const campos = resultado.slice(0, 20).map(item => ({
      id: item.id, nombre: item.nombre, estado: item.estado || item.activo,
    }));
    const sufijo = resultado.length > 20 ? ` (mostrando 20 de ${resultado.length})` : '';
    return JSON.stringify(campos) + sufijo;
  }
  if (resultado && Array.isArray(resultado.movimientos)) {
    return JSON.stringify({ ...resultado, movimientos: resultado.movimientos.slice(-10) });
  }
  const json = JSON.stringify(resultado);
  if (json.length > 6000) return json.slice(0, 6000) + '... [truncado]';
  return json;
}

async function procesarMensaje(chatId, texto) {
  const groq = getClient();
  const t0 = Date.now();
  const messages = obtenerHistorial(chatId);
  messages.push({ role: 'user', content: texto });

  const MAX_ITER = 5;

  for (let i = 0; i < MAX_ITER; i++) {
    const tLlm = Date.now();
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      tools: TOOLS,
      tool_choice: 'auto',
      parallel_tool_calls: false,
    });
    console.log(`[agent] LLM ${Date.now() - tLlm}ms | iter ${i + 1}`);

    const choice = response.choices[0];
    const msg = choice.message;
    messages.push(msg);

    if (choice.finish_reason === 'stop') {
      guardarHistorial(chatId, messages);
      console.log(`[agent] total ${Date.now() - t0}ms`);
      return msg.content?.trim() || '_(sin respuesta)_';
    }

    if (choice.finish_reason === 'tool_calls' && msg.tool_calls?.length) {
      const toolResults = [];
      // Ejecutar tools en paralelo cuando sea posible
      const promises = msg.tool_calls.map(async (tc) => {
        console.log(`[agent] tool_call: ${tc.function.name}`, tc.function.arguments);
        const tTool = Date.now();
        let resultado;
        try {
          resultado = await ejecutarTool(tc.function.name, JSON.parse(tc.function.arguments || '{}'));
        } catch (err) {
          console.error(`[agent] error en tool ${tc.function.name}:`, err.message);
          resultado = { error: err.message };
        }
        console.log(`[agent] tool ${tc.function.name} ${Date.now() - tTool}ms`);
        return { role: 'tool', tool_call_id: tc.id, content: comprimirResultado(tc.function.name, resultado) };
      });
      toolResults.push(...await Promise.all(promises));
      messages.push(...toolResults);
      continue;
    }

    break;
  }

  return 'No pude procesar tu consulta. Intentá de nuevo.';
}

function limpiarHistorial(chatId) {
  historiales.delete(chatId);
}

module.exports = { procesarMensaje, limpiarHistorial };
