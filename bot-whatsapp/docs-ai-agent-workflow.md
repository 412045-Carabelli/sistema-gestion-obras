# Workflow AI Agent Conversacional SGO

**Archivo**: `n8n-workflow-ai-agent-sgo.json`
**Versión**: 2.0 (Reemplazo del workflow lineal)
**Estado**: Producción-Ready
**Fecha**: 2026-05-19

---

## 📋 Resumen Ejecutivo

Workflow n8n que implementa un **bot conversacional inteligente** para WhatsApp. El usuario puede hablar libremente (texto o audio) y el bot:
1. Entiende la intención usando OpenAI GPT-4o-mini
2. Pregunta datos faltantes de forma conversacional
3. Ejecuta acciones reales en SGO (transacciones, tareas, reportes)
4. Retorna información o confirma registros

**Capacidades del bot**:
- ✅ Ver saldos de clientes/proveedores
- ✅ Ver detalle de obras
- ✅ Crear tareas (para obras o agenda)
- ✅ Registrar pagos/cobros
- ✅ Generar facturas
- ✅ Enviar cotizaciones (condiciones del presupuesto)
- ✅ Enviar PDFs (cuenta corriente)
- ✅ Procesar audio (transcripción automática)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│ USUARIO WHATSAPP (texto o audio)                               │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │ Webhook Meta Business   │ ← Meta envía mensaje
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │ Verificar Token         │ ← Validar origen
        └────────────┬────────────┘
                     │
        ┌────────────▼─────────────────────┐
        │ IF: ¿Es Audio?                  │
        └────┬───────────────────────┬────┘
             │ SÍ                    │ NO
        ┌────▼──────────────┐   ┌────▼──────────┐
        │ Descargar de Meta │   │ Usar texto    │
        │ ↓                 │   │ directo       │
        │ Groq Whisper STT  │   └────┬──────────┘
        └────┬──────────────┘        │
             └────┬────────────────┬─┘
                  │ Merge: texto unificado
        ┌─────────▼─────────────────┐
        │ AI Agent (GPT-4o-mini)    │ ← Brain del bot
        │ + Window Buffer Memory    │
        │ + Tools (11 herramientas) │
        └────┬────────────────────┬─┘
             │ Tools             │ Respuesta
    ┌────────────────┐       ┌───▼──────┐
    │ • Ver saldos   │       │ Enviar a │
    │ • Listar datos │       │ Meta     │
    │ • Crear tareas │       │ API      │
    │ • Registrar    │       └──────────┘
    │ • Generar PDF  │
    └────────────────┘
```

---

## 🔧 Nodos del Workflow

### 1. **Webhook Meta Business API** (entrada)
- **Tipo**: `n8n-nodes-base.webhook`
- **Path**: `/webhook/whatsapp-bot`
- **Métodos soportados**:
  - `GET` → verificación inicial del webhook en Meta Business Manager
  - `POST` → recibir mensajes reales

**GET esperado desde Meta**:
```
GET /webhook/whatsapp-bot?hub.mode=subscribe&hub.challenge=xxx&hub.verify_token=sgo_webhook_verify_secret
```

**POST esperado**:
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "5491123456789",
          "type": "text",
          "text": { "body": "hola" }
        }]
      }
    }]
  }]
}
```

---

### 2. **Code: Verificar Token + Validar**
- Verifica `hub.verify_token` en GET (setup webhook Meta)
- Valida que el POST contiene `messages`
- Retorna flag `is_post: true` si es POST válido

---

### 3. **IF: ¿Es POST?**
- Rama true → procesar mensaje
- Rama false → ignorar (webhook setup)

---

### 4. **Code: Extraer Mensaje**
Parsea el webhook de Meta y extrae:
```json
{
  "phone_number": "5491123456789",
  "timestamp": 1234567890,
  "message_type": "text|audio|image",
  "text_content": "hola",
  "audio_media_id": "xxx" (si es audio)
}
```

---

### 5. **IF: ¿Es Audio?**
- Si `message_type === "audio"` → descargar y transcribir
- Si no → ir directo al merge con texto

---

### 6. **HTTP: Descargar Audio de Meta**
```
GET https://graph.instagram.com/v19.0/{audio_media_id}
Authorization: Bearer {META_API_TOKEN}
```
Retorna URL del archivo de audio hosteado por Meta.

---

### 7. **HTTP: Groq Whisper STT**
```
POST https://api.groq.com/openai/v1/audio/transcriptions
```
- **Modelo**: `whisper-large-v3-turbo` (gratis, rápido)
- **Language**: `es` (español)
- **Input**: URL del audio desde Meta
- **Output**: texto transcripto

---

### 8. **Merge: Unificar Texto**
Combina:
- Rama 1: texto transcripto (si audio)
- Rama 2: texto directo (si no audio)

Resultado → `text_content`

---

### 9. **AI Agent: GPT-4o-mini + Tools**
**El corazón del bot.**

#### Configuración:
- **Modelo**: `gpt-4o-mini` (balance costo/calidad)
- **Memory**: `Window Buffer Memory` (últimos 10 mensajes por sesión)
- **Session ID**: número de teléfono del usuario
- **System Prompt** (ver abajo)
- **11 Tools** conectadas

#### System Prompt:
```
Sos el asistente virtual de SGO (Sistema de Gestión de Obras).
Respondés siempre en español, en tono profesional pero amigable.

CAPACIDADES:
- Ver saldos de clientes, proveedores u obras
- Crear tareas para una obra o para la agenda
- Registrar pagos a proveedores
- Registrar cobros a clientes
- Generar facturas
- Enviar cotización/condiciones de presupuesto de una obra

REGLAS:
1. Siempre confirmá los datos antes de ejecutar una acción
2. Si faltan datos, preguntá uno por vez
3. Si el usuario no especifica el ID, listá las opciones
4. Para montos, aceptá formatos: "50 mil", "50000", "$50.000"
5. Máximo 3-4 líneas por mensaje
6. Si algo falla, explicá con palabras simples
```

#### Tools Disponibles:

| Tool | Endpoint | Método | Descripción |
|------|----------|--------|-------------|
| `ver_saldos_clientes` | `/api/saldos/clientes` | GET | Retorna dict con `{cliente_id: saldo, ...}` |
| `ver_saldos_proveedores` | `/api/saldos/proveedores` | GET | Retorna dict con `{proveedor_id: saldo, ...}` |
| `listar_clientes` | `/api/clientes` | GET | Retorna `[{id, nombre, ...}, ...]` |
| `listar_proveedores` | `/api/proveedores/simple` | GET | Retorna `[{id, nombre, ...}, ...]` |
| `listar_obras` | `/api/obras` | GET | Retorna `[{id, nombre, ...}, ...]` |
| `ver_detalle_obra` | `/api/obras/{id}` | GET | Retorna obra completa + condiciones |
| `crear_tarea_obra` | `/api/obras/tareas/{idObra}` | POST | Crea tarea en obra |
| `crear_tarea_agenda` | `/api/agenda/tareas` | POST | Crea tarea en agenda |
| `registrar_transaccion` | `/api/transacciones` | POST | Registra pago/cobro |
| `pdf_cta_cte_cliente` | `/api/reportes/cuenta-corriente-pdf/cliente/{id}` | POST | Retorna PDF |
| `pdf_cta_cte_proveedor` | `/api/reportes/cuenta-corriente-pdf/proveedor/{id}` | POST | Retorna PDF |

---

### 10. **Code: Preparar Respuesta Meta**
Formatea la respuesta del AI Agent para Meta Business API:
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "5491123456789",
  "type": "text",
  "text": {
    "body": "Acá va la respuesta del bot"
  }
}
```

---

### 11. **HTTP: Enviar Mensaje Meta**
```
POST https://graph.instagram.com/v19.0/{META_PHONE_ID}/messages
Authorization: Bearer {META_API_TOKEN}
Body: respuesta formateada
```

---

## 🎯 Flujos de Conversación Ejemplo

### Ejemplo 1: Ver Saldos
```
Usuario: "saldos de proveedores"
Bot: "Actualizando... [llama a /api/saldos/proveedores]
     Estos son los saldos pendientes:
     • García: $50.000
     • López: $15.000
     • Construcciones XYZ: $100.000"
```

### Ejemplo 2: Pagar Proveedor (con audio)
```
Usuario: [audio: "quiero pagarle a garcía cincuenta mil pesos por plomería"]

Bot: [Groq transcribe]
     "¿Confirmo el pago?
      • Proveedor: García
      • Monto: $50.000
      • Concepto: plomería
      Respondé Confirmar o Cancelar"

Usuario: "confirmar"

Bot: "✅ Pago registrado (ID: 8472)
     $50.000 a García Construcciones"
```

### Ejemplo 3: Crear Tarea
```
Usuario: "crear tarea en obra 5"

Bot: "¿Cuál es el título de la tarea?"

Usuario: "Instalar ventanas"

Bot: "¿Quién es responsable?
     1. Vidriería López (ID: 23)
     2. García Obras (ID: 15)
     O escribí un nombre"

Usuario: "garcía"

Bot: "¿Fecha límite? (ej: 2026-05-25 o mañana)"

Usuario: "mañana"

Bot: "✅ Tarea creada en Obra 5
     Título: Instalar ventanas
     Responsable: García Obras
     Vencimiento: 2026-05-20"
```

### Ejemplo 4: PDF Cuenta Corriente
```
Usuario: "dame la cuenta corriente del cliente martínez"

Bot: [busca ID de Martínez]
     [genera PDF]
     [sube a Meta]
     "📄 Cuenta Corriente - Martínez
      Documento enviado. Monto a cobrar: $120.000"
```

---

## 📝 Configuración Inicial

### 1. Obtener Credenciales

#### Meta Business API
1. Ir a `business.facebook.com`
2. Apps → Crear app → Seleccionar "Business"
3. Agregar producto "WhatsApp"
4. Obtener:
   - `META_API_TOKEN` (permanente user token o app token)
   - `META_PHONE_ID` (número de teléfono WhatsApp Business)
   - `META_VERIFY_TOKEN` (crear uno personalizado, ej: `sgo_webhook_verify_secret`)

#### OpenAI API
1. Ir a `platform.openai.com/api/keys`
2. Crear API key
3. Copiar a `OPENAI_API_KEY`

#### Groq (gratis)
1. Ir a `console.groq.com`
2. Crear API key
3. Copiar a `GROQ_API_KEY`

### 2. Actualizar `.env.n8n`
```bash
nano .env.n8n
```
Completar:
```env
META_VERIFY_TOKEN=tu_token_personalizado
META_API_TOKEN=tu_token_meta
META_PHONE_ID=tu_phone_id
OPENAI_API_KEY=sk-proj-xxx
GROQ_API_KEY=gsk_xxx
API_GATEWAY_URL=http://api-gateway:8080
```

### 3. Iniciar Docker
```bash
docker-compose -f docker-compose.n8n.yml up -d
```

### 4. Importar Workflow en n8n
1. Abrir `http://localhost:5678`
2. Workflows → Import from JSON
3. Pegar contenido de `n8n-workflow-ai-agent-sgo.json`
4. Crear credenciales:
   - OpenAI (con API key)
   - Groq (con API key)
   - Meta (con token)

### 5. Registrar Webhook en Meta
1. Ir a Meta Business Manager → WhatsApp App Settings
2. Configuration → Webhook
3. URL: `https://tu-n8n-url.com/webhook/whatsapp-bot` (o localhost si es dev)
4. Token de verificación: el que pusiste en `META_VERIFY_TOKEN`
5. Click Verify & Save

### 6. Activar Workflow
En n8n, activar el workflow (botón arriba a la derecha).

---

## 🧪 Testing

### Test 1: Webhook Setup
```bash
curl -X GET "http://localhost:5678/webhook/whatsapp-bot?hub.mode=subscribe&hub.challenge=test_challenge&hub.verify_token=sgo_webhook_verify_secret"
```
Debe retornar `test_challenge` en el body.

### Test 2: Mensaje de Texto
```bash
curl -X POST http://localhost:5678/webhook/whatsapp-bot \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "5491123456789",
            "type": "text",
            "text": { "body": "hola" },
            "timestamp": 1234567890
          }]
        }
      }]
    }]
  }'
```

Verificar en n8n dashboard:
1. Workflow debe ejecutarse
2. AI Agent debe procesar "hola"
3. Meta API debe recibir respuesta

### Test 3: Ver Logs
```bash
docker logs sgo_n8n -f
```

### Test 4: Con WhatsApp Real
1. Guardar el webhook URL real en `META_VERIFY_TOKEN`
2. Registrar en Meta Business Manager
3. Enviar mensaje desde WhatsApp
4. El bot debe responder en 1-5 segundos

---

## 🔍 Debugging

### El bot no responde
1. Verificar logs: `docker logs sgo_n8n -f`
2. Verificar credenciales en n8n (OpenAI, Groq, Meta)
3. Verificar webhook URL está activa
4. Verificar `META_VERIFY_TOKEN` coincide en Meta Business Manager

### Groq STT falla
1. Verificar `GROQ_API_KEY` está correcto
2. Verificar archivo de audio es válido
3. Verificar audio es MP3/Ogg/WAV

### OpenAI retorna error
1. Verificar `OPENAI_API_KEY` tiene saldo
2. Verificar modelo `gpt-4o-mini` es accesible con esa key
3. Verificar rate limits no excedidos

### API Gateway retorna 503
1. Verificar servicios SGO están corriendo: `docker ps | grep sgo`
2. Verificar port 8080 es accesible

---

## 📊 Monitoreo

### Dashboard n8n
```
http://localhost:5678/admin/execution
```
Ver:
- Executions completadas/fallidas
- Tiempo promedio por workflow
- Errores últimas 24 horas

### Métricas SQL
```sql
-- Transacciones creadas hoy desde WhatsApp Bot
SELECT COUNT(*) FROM transacciones
WHERE CAST(creadoEn AS DATE) = CAST(GETDATE() AS DATE)
  AND medio_pago = 'WhatsApp Bot';

-- Últimas 10 transacciones
SELECT TOP 10 * FROM transacciones
ORDER BY id DESC;
```

### Logs de n8n
```bash
# Real-time
docker logs sgo_n8n -f

# Últimas 100 líneas
docker logs sgo_n8n --tail 100
```

---

## ⚠️ Limitaciones & Roadmap

### Limitaciones Actuales
1. **Cotización PDF**: No existe endpoint dedicado. Se retorna texto de condiciones presupuestarias.
2. **Memory**: Window Buffer Memory es in-memory. Si n8n se reinicia, se pierde historial.
3. **Confirmaciones**: El bot pide confirmación pero no soporta botones de WhatsApp (solo texto).
4. **Adjuntos factura**: `POST /api/facturas` requiere archivo. El bot no puede generar PDF de factura aún.

### Roadmap Futuro
- [ ] Agregar persistencia de memory con Redis
- [ ] Endpoint de cotización PDF en reportes-service
- [ ] Soportar botones de WhatsApp (listas interactivas)
- [ ] Generar PDFs de facturas desde n8n
- [ ] Agregar disparadores: Email, Slack, Formulario Web
- [ ] Soporte multiidioma

---

## 📚 Archivos Relacionados

- `n8n-workflow-ai-agent-sgo.json` — Workflow JSON completo
- `.env.n8n` — Variables de entorno
- `docker-compose.n8n.yml` — Configuración Docker
- Plan: `/claude/plans/soft-knitting-dove.md`

---

**Versión**: 2.0
**Última actualización**: 2026-05-19
**Mantenedor**: SGO Team
