# Migración: Workflow Lineal → AI Agent Conversacional

**Fecha**: 2026-05-19
**Versión anterior**: 1.0 (workflow lineal)
**Versión nueva**: 2.0 (AI Agent conversacional)

---

## 🔄 Qué Cambió

### Antes (v1.0 - Workflow Lineal)
```
Webhook → Extraer datos → API POST → Respuesta
```
- Flujo rígido: usuario envía JSON estructurado
- Solo crea transacciones
- Una operación por mensaje
- Sin conversación

### Ahora (v2.0 - AI Agent)
```
Webhook → Audio/Texto → AI (GPT-4o-mini) → Tools → Respuesta
```
- Conversacional: usuario habla libremente
- Múltiples operaciones (saldos, tareas, transacciones, PDFs)
- Multi-turno: el bot pregunta qué falta
- Soporta audio con Groq Whisper

---

## 📋 Checklist de Migración

### Fase 1: Preparación (30 min)

- [ ] **Obtener Credenciales**:
  - [ ] `META_API_TOKEN` (Meta Business API)
  - [ ] `META_PHONE_ID` (número WhatsApp Business)
  - [ ] `META_VERIFY_TOKEN` (personalizado)
  - [ ] `OPENAI_API_KEY` (OpenAI)
  - [ ] `GROQ_API_KEY` (Groq Whisper)

- [ ] **Backup**:
  ```bash
  cp .env.n8n .env.n8n.backup
  cp n8n-workflow-whatsapp-transacciones.json n8n-workflow-v1.json
  ```

- [ ] **Actualizar `.env.n8n`** con nuevas variables:
  ```env
  META_VERIFY_TOKEN=tu_token_aqui
  META_API_TOKEN=tu_token_aqui
  META_PHONE_ID=tu_phone_id
  OPENAI_API_KEY=sk-proj-xxx
  GROQ_API_KEY=gsk_xxx
  ```

### Fase 2: Importar Nuevo Workflow (10 min)

- [ ] Abrir n8n: `http://localhost:5678`
- [ ] Workflows → Create New
- [ ] Workflows → Import from JSON
- [ ] Pegar contenido de `n8n-workflow-ai-agent-sgo.json`
- [ ] Click Import

### Fase 3: Configurar Credenciales (15 min)

- [ ] En n8n, ir a Credentials
- [ ] Crear/Actualizar:
  - [ ] OpenAI (con `OPENAI_API_KEY`)
  - [ ] Groq (con `GROQ_API_KEY`)
  - [ ] Meta (con `META_API_TOKEN`)
- [ ] En el workflow, asignar credenciales a:
  - [ ] Nodo "AI Agent"
  - [ ] Nodo "HTTP: Descargar Audio"
  - [ ] Nodo "HTTP: Enviar Mensaje Meta"
  - Todos los nodos HTTP de tools

### Fase 4: Registrar Webhook en Meta (15 min)

- [ ] Meta Business Manager → WhatsApp App
- [ ] Configuration → Webhooks
- [ ] **Callback URL**: `https://tu-instancia-n8n.com/webhook/whatsapp-bot`
  - Para localhost: NO es posible. Necesitas:
    - Tunnel (ngrok, cloudflare tunnel)
    - Servidor público
    - O usar modo test con webhook URL simulado
- [ ] **Verify Token**: exactamente el valor de `META_VERIFY_TOKEN`
- [ ] Click Verify and Save

### Fase 5: Testing (20 min)

- [ ] **Test webhook setup**:
  ```bash
  curl -X GET "http://localhost:5678/webhook/whatsapp-bot?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=tu_verify_token"
  ```
  Debe retornar `test123` en el body.

- [ ] **Test mensaje texto** (via curl):
  ```bash
  curl -X POST http://localhost:5678/webhook/whatsapp-bot \
    -H "Content-Type: application/json" \
    -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"5491234567890","type":"text","text":{"body":"hola"},"timestamp":1234567890}]}}]}]}'
  ```

- [ ] Verificar en n8n Executions que la workflow corrió sin errores

- [ ] **Test mensaje real** (si ya está registrado en Meta):
  - Enviar WhatsApp: "hola"
  - Bot debe responder en 2-5 segundos

### Fase 6: Deactivar Workflow v1.0 (5 min)

- [ ] Ir al workflow viejo `n8n-workflow-whatsapp-transacciones`
- [ ] Click en el toggle de activación → OFF
- [ ] Guardar

- [ ] **Activar Workflow v2.0**:
  - [ ] Ir al workflow nuevo
  - [ ] Click en el toggle → ON
  - [ ] Guardar

---

## 🚨 Diferencias de Comportamiento

### Payload Esperado

#### v1.0 (Viejo)
```json
{
  "phone_number": "5491234567890",
  "message_data": {
    "obra_id": 1,
    "tipo_transaccion": "PAGO",
    "associated_id": 5,
    "associated_type": "CLIENTE",
    "monto": 5000.00,
    "forma_pago": "Transferencia",
    "concepto": "Pago hormigonado"
  }
}
```
El cliente **debe** enviar toda la estructura JSON.

#### v2.0 (Nuevo)
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "5491234567890",
          "type": "text",
          "text": { "body": "quiero pagarle a garcía cincuenta mil" },
          "timestamp": 1234567890
        }]
      }
    }]
  }]
}
```
El cliente **solo** escribe en lenguaje natural.

### Flujo de Confirmación

#### v1.0
- Crea transacción inmediatamente
- Si error: retorna mensaje de error

#### v2.0
- Pregunta datos faltantes
- Muestra resumen (monto, concepto, cliente)
- Pide confirmación explícita: "Confirmar / Cancelar"
- **Solo después** registra

---

## 🔧 Troubleshooting Migración

### Error: "Invalid verify token"
**Causa**: `META_VERIFY_TOKEN` en `.env.n8n` no coincide con Meta Business Manager

**Solución**:
1. En Meta Business Manager, copiar exactamente el verify token configurado
2. Actualizar `.env.n8n`:
   ```env
   META_VERIFY_TOKEN=exactamente_el_mismo_token
   ```
3. Reiniciar n8n: `docker restart sgo_n8n`
4. Volver a registrar webhook en Meta

### Error: "OpenAI API key invalid"
**Causa**: API key incorrecta o sin saldo

**Solución**:
1. Ir a `platform.openai.com/account/billing/overview`
2. Verificar saldo
3. Si no hay saldo, agregar método de pago
4. Copiar API key nueva a `.env.n8n`

### Error: "Groq API key invalid"
**Causa**: API key incorrecta

**Solución**:
1. Ir a `console.groq.com`
2. Verificar API key
3. Actualizar `.env.n8n`

### Webhook no se registra en Meta
**Causa**: URL no es públicamente accesible (localhost no funciona)

**Solución**: Usar tunnel:
```bash
# Opción 1: ngrok (requiere cuenta)
ngrok http 5678
# Usar URL generada en Meta

# Opción 2: Cloudflare Tunnel (gratis)
cloudflared tunnel create n8n
cloudflared tunnel route dns n8n tu-dominio.com
cloudflared tunnel run n8n --url http://localhost:5678
```

### El bot no procesa audio
**Causa**: Groq API o Meta API retorna error

**Solución**:
1. Verificar audio en debug mode en n8n Executions
2. Verificar que Meta envía `message.audio.id` correctamente
3. Verificar Groq puede descargar URL desde Meta
4. Revisar logs: `docker logs sgo_n8n -f`

---

## 📊 Comparativa: Costo Mensual

### v1.0 (Workflow Lineal)
- **n8n**: $0 (auto-hosted)
- **APIs SGO**: $0 (local)
- **Meta**: $0 (incluido en plan WhatsApp Business)
- **Total**: $0

### v2.0 (AI Agent)
- **n8n**: $0 (auto-hosted)
- **APIs SGO**: $0 (local)
- **Meta**: $0 (incluido)
- **OpenAI GPT-4o-mini**: ~$0.05-0.10 por 1000 mensajes
  - Promedio: 100 tokens/mensaje × $0.15/1M tokens = $0.000015 por mensaje
  - 1000 mensajes/mes = $0.015
- **Groq Whisper**: $0 (gratis, sin límite)
- **Total**: < $1/mes

---

## ✅ Validación Post-Migración

Ejecutar estos tests:

```bash
# Test 1: Webhook validation
./test-webhook.sh

# Test 2: Ver logs
docker logs sgo_n8n | grep -i "error" | head -20

# Test 3: Ejecutar queries SQL
docker exec sgo_sql-server sqlcmd -U sa -P ... << 'EOF'
SELECT COUNT(*) as tx_count FROM transacciones
WHERE CAST(creadoEn AS DATE) = CAST(GETDATE() AS DATE);
EOF

# Test 4: Enviar mensaje real desde WhatsApp
# "Hola" → bot debe responder en < 5 segundos
```

---

## 🔄 Rollback (si es necesario)

Si algo falla y necesitas volver a v1.0:

```bash
# 1. Deactivar v2.0 en n8n
# Workflows → AI Agent → Toggle OFF

# 2. Activar v1.0 en n8n
# Workflows → Whatsapp Transacciones → Toggle ON

# 3. Restaurar variables de entorno
cp .env.n8n.backup .env.n8n

# 4. Registrar webhook viejo en Meta
# Meta Business Manager → usar endpoint anterior
```

---

## 📚 Documentación

- `docs-ai-agent-workflow.md` — Guía completa del nuevo workflow
- `README-N8N.md` — Índice general (actualizado)
- `n8n-workflow-ai-agent-sgo.json` — Archivo JSON para importar

---

**Duración total**: ~1.5 horas
**Complejidad**: Media
**Apoyo**: Contactar SGO Team
