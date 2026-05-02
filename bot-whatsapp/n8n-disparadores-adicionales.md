# N8N: Disparadores Adicionales para Transacciones

Este documento describe cómo agregar más canales de disparadores al workflow principal.

---

## Patrón General

Todos los disparadores siguen este patrón:

```
[DISPARADOR ESPECÍFICO]
    ↓
[Extraer datos → Normalizar formato]
    ↓
[Set Variables: obra_id, monto, tipo_transaccion, etc.]
    ↓
[Crear Transacción API] ← Nodo compartido
    ↓
[Check Success]
    ↓
[Responder al usuario en el canal original]
```

**Ventaja**: El nodo **"Crear Transacción API"** es único, por lo que si cambias la API, cambias en un solo lugar.

---

## 1. Disparador: Email

### Uso
El usuario envía un email estructurado:

```
Para: transacciones@sgo.local
Asunto: TRANSACCION OBRA=1 TIPO=PAGO
Cuerpo:
Cliente: 5
Monto: 5000
Forma Pago: Transferencia
Observación: Pago por hormigonado
```

### Nodos a Agregar

```json
{
  "id": "email_trigger",
  "name": "Email Trigger",
  "type": "n8n-nodes-base.emailReadImap",
  "parameters": {
    "host": "{{ $env.IMAP_HOST }}",
    "port": 993,
    "user": "{{ $env.EMAIL_USER }}",
    "password": "{{ $env.EMAIL_PASSWORD }}",
    "mailbox": "INBOX"
  }
},
{
  "id": "parse_email",
  "name": "Parse Email Subject",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "assignments": [
      {
        "name": "obra_id",
        "value": "={{ $node['Email Trigger'].json.subject.match(/OBRA=(\d+)/)[1] }}"
      },
      {
        "name": "tipo_transaccion",
        "value": "={{ $node['Email Trigger'].json.subject.match(/TIPO=(\w+)/)[1].toUpperCase() }}"
      },
      {
        "name": "body_lines",
        "value": "={{ $node['Email Trigger'].json.body.split('\\n') }}"
      }
    ]
  }
},
{
  "id": "extract_email_data",
  "name": "Extract Email Data",
  "type": "n8n-nodes-base.code",
  "parameters": {
    "mode": "runOnceForAllItems",
    "jsCode": "const body = $node['Parse Email Subject'].json.body_lines;\nconst data = {};\nbody.forEach(line => {\n  const [key, value] = line.split(':').map(s => s.trim());\n  if (key === 'Cliente') data.associated_id = parseInt(value);\n  if (key === 'Monto') data.monto = parseFloat(value);\n  if (key === 'Forma Pago') data.forma_pago = value;\n  if (key === 'Observación') data.concepto = value;\n});\nreturn [{ json: { ...data, associated_type: 'CLIENTE' } }];"
  }
},
{
  "id": "send_email_response",
  "name": "Enviar Email Confirmación",
  "type": "n8n-nodes-base.emailSend",
  "parameters": {
    "fromEmail": "{{ $env.EMAIL_USER }}",
    "toEmail": "={{ $node['Email Trigger'].json.from }}",
    "subject": "✅ Transacción {{ $node['Crear Transacción API'].json.id }} creada",
    "textContent": "Tu transacción ha sido procesada exitosamente.\n\nDetalles:\n- ID: {{ $node['Crear Transacción API'].json.id }}\n- Monto: ${{ $node['extract_email_data'].json.monto }}\n- Tipo: {{ $node['Parse Email Subject'].json.tipo_transaccion }}"
  }
}
```

### Configuración
1. Agregar nodo **"Email Trigger (IMAP)"**
2. Configurar credenciales en n8n: `IMAP_HOST`, `EMAIL_USER`, `EMAIL_PASSWORD`
3. Conectar → **Parse Email Subject** → **Extract Email Data** → **Set Variables** → **Crear Transacción API**

### Ejemplo de Email

```
De: jefe@construccion.com
Para: transacciones@sgo.local
Asunto: TRANSACCION OBRA=1 TIPO=PAGO

Cliente: 5
Monto: 5000.50
Forma Pago: Transferencia bancaria
Observación: Pago parcial - 30% completado
```

---

## 2. Disparador: Slack

### Uso
Usuario entra comando en Slack:

```
/transaccion obra=1 cliente=5 monto=5000 tipo=pago
```

O el usuario completa un formulario interactivo en Slack.

### Nodos a Agregar

```json
{
  "id": "slack_trigger",
  "name": "Slack Trigger",
  "type": "n8n-nodes-base.slack",
  "parameters": {
    "event": "message_posted",
    "channel": "transacciones",
    "slackBotToken": "{{ $env.SLACK_BOT_TOKEN }}"
  }
},
{
  "id": "parse_slack_command",
  "name": "Parse Slack Command",
  "type": "n8n-nodes-base.code",
  "parameters": {
    "jsCode": "const text = $node['Slack Trigger'].json.text;\nconst regex = /([\\w]+)=([\\w\\.\\-]+)/g;\nconst match = (regex, name) => {\n  const r = new RegExp(`${name}=([\\\\w\\\\.\\\\-]+)`);\n  return r.exec(text)?.[1];\n};\nreturn [{ json: {\n  obra_id: parseInt(match(regex, 'obra')),\n  associated_id: parseInt(match(regex, 'cliente') || match(regex, 'proveedor')),\n  associated_type: match(regex, 'cliente') ? 'CLIENTE' : 'PROVEEDOR',\n  monto: parseFloat(match(regex, 'monto')),\n  tipo_transaccion: match(regex, 'tipo').toUpperCase()\n} }];"
  }
},
{
  "id": "send_slack_response",
  "name": "Enviar Slack Confirmación",
  "type": "n8n-nodes-base.slack",
  "parameters": {
    "slackBotToken": "{{ $env.SLACK_BOT_TOKEN }}",
    "channel": "${{ $node['Slack Trigger'].json.channel_id }}",
    "messageType": "text",
    "text": "✅ Transacción creada: <{{ $env.DASHBOARD_URL }}/transacciones/${{ $node['Crear Transacción API'].json.id }}|#${{ $node['Crear Transacción API'].json.id }}>\nMonto: ${{ $node['parse_slack_command'].json.monto }}"
  }
}
```

### Configuración

1. Crear Slack App en https://api.slack.com/apps
2. Habilitar **Slash Commands** y **Event Subscriptions**
3. Registrar endpoint de n8n en Slack
4. Obtener **Bot Token** y **Signing Secret**
5. Agregar a variables de entorno: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`

### Ejemplo de Comando

```
/transaccion obra=1 cliente=5 monto=5000 tipo=pago forma_pago=transferencia
```

---

## 3. Disparador: Formulario Web

### Uso
Formulario HTML/SPA que envía datos directamente a n8n:

```html
<form id="transaccionForm">
  <select name="obra_id">
    <option value="1">Obra A</option>
    <option value="2">Obra B</option>
  </select>
  <select name="tipo_transaccion">
    <option value="PAGO">Pago</option>
    <option value="COBRO">Cobro</option>
  </select>
  <select name="associated_id">
    <option value="5">Cliente X</option>
    <option value="6">Proveedor Y</option>
  </select>
  <input type="number" name="monto" placeholder="Monto" />
  <input type="file" name="archivo" accept=".pdf,.jpg" />
  <button type="submit">Crear Transacción</button>
</form>

<script>
document.getElementById('transaccionForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  const payload = Object.fromEntries(data);

  fetch('https://your-n8n.com/webhook/formulario-transacciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(r => r.json())
  .then(r => alert('✅ ' + r.message))
  .catch(e => alert('❌ Error: ' + e.message));
});
</script>
```

### Nodos a Agregar

```json
{
  "id": "form_webhook",
  "name": "Webhook Formulario",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "formulario-transacciones"
  }
},
{
  "id": "validate_form",
  "name": "Validar Datos",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "nodes": [
        {
          "name": "Monto > 0",
          "value1": "={{ $node['form_webhook'].json.monto }}",
          "operator": ">",
          "value2": "0"
        },
        {
          "name": "Obra existe",
          "value1": "={{ $node['form_webhook'].json.obra_id }}",
          "operator": "notEmpty"
        }
      ]
    }
  }
},
{
  "id": "upload_file",
  "name": "Subir Archivo a MinIO",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "={{ $env.MINIO_URL }}/sgo-transacciones/{{ $now.format('yyyy-MM-dd') }}/{{ $json.archivo }}",
    "requestMethod": "PUT",
    "body": "={{ $node['form_webhook'].json.archivo_base64 }}"
  }
},
{
  "id": "send_form_response",
  "name": "Responder Formulario",
  "type": "n8n-nodes-base.respondToWebhook",
  "parameters": {
    "statusCode": 200,
    "body": "={{ { message: 'Transacción creada', id: $node['Crear Transacción API'].json.id } }}"
  }
}
```

### Configuración

1. Agregar nodo **"Webhook"** con PATH `formulario-transacciones`
2. Copiar URL pública del webhook
3. Registrar en formulario HTML: `fetch('https://your-n8n.com/webhook/formulario-transacciones')`

---

## 4. Disparador: Google Sheets

### Uso
Una hoja de cálculo compartida donde agregan filas:

| Obra | Tipo | Cliente | Monto | Concepto | Fecha |
|------|------|---------|-------|----------|-------|
| 1 | PAGO | 5 | 5000 | Hormigonado | 2026-04-29 |
| 2 | COBRO | 3 | 2500 | Alquiler grúa | 2026-04-29 |

### Nodos a Agregar

```json
{
  "id": "gsheets_trigger",
  "name": "Google Sheets Trigger",
  "type": "n8n-nodes-base.googleSheets",
  "parameters": {
    "spreadsheetId": "{{ $env.GSHEETS_ID }}",
    "sheetName": "Transacciones",
    "event": "rowAdded",
    "authenticationType": "serviceAccount"
  }
},
{
  "id": "parse_gsheets_row",
  "name": "Parse GSheets Row",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "assignments": [
      {
        "name": "obra_id",
        "value": "={{ parseInt($node['gsheets_trigger'].json.cells[0]) }}"
      },
      {
        "name": "tipo_transaccion",
        "value": "={{ $node['gsheets_trigger'].json.cells[1].toUpperCase() }}"
      },
      {
        "name": "associated_id",
        "value": "={{ parseInt($node['gsheets_trigger'].json.cells[2]) }}"
      },
      {
        "name": "monto",
        "value": "={{ parseFloat($node['gsheets_trigger'].json.cells[3]) }}"
      },
      {
        "name": "concepto",
        "value": "={{ $node['gsheets_trigger'].json.cells[4] }}"
      }
    ]
  }
},
{
  "id": "update_gsheets_status",
  "name": "Marcar Procesada en GSheets",
  "type": "n8n-nodes-base.googleSheets",
  "parameters": {
    "spreadsheetId": "{{ $env.GSHEETS_ID }}",
    "sheetName": "Transacciones",
    "operation": "updateCell",
    "column": "F",
    "value": "✅ ID: {{ $node['Crear Transacción API'].json.id }}"
  }
}
```

---

## 5. Disparador: Telegram

### Uso

```
/transaccion
Bot: ¿Qué obra? (1, 2, 3...)
Usuario: 1
Bot: ¿Cliente o Proveedor?
Usuario: Cliente
Bot: ¿Monto?
Usuario: 5000
Bot: ✅ Transacción creada
```

### Nodos Básicos

```json
{
  "id": "telegram_trigger",
  "name": "Telegram Trigger",
  "type": "n8n-nodes-base.telegramTrigger",
  "parameters": {
    "telegramBotToken": "{{ $env.TELEGRAM_BOT_TOKEN }}",
    "event": "update"
  }
},
{
  "id": "telegram_conversation",
  "name": "Multi-step Conversation",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "assignments": [
      {
        "name": "step",
        "value": "={{ $node['telegram_trigger'].json.step || 1 }}"
      }
    ]
  }
}
```

---

## 6. Disparador: Archivo CSV/Excel

### Uso

Sube un archivo CSV:
```csv
obra_id,tipo_transaccion,associated_id,associated_type,monto,concepto
1,PAGO,5,CLIENTE,5000,Hormigonado
2,COBRO,3,PROVEEDOR,2500,Materiales
```

### Nodos a Agregar

```json
{
  "id": "file_trigger",
  "name": "Watch File",
  "type": "n8n-nodes-base.fileSystemWatcherTrigger",
  "parameters": {
    "path": "/uploads/transacciones",
    "pattern": "*.csv"
  }
},
{
  "id": "parse_csv",
  "name": "Parse CSV",
  "type": "n8n-nodes-base.csv",
  "parameters": {
    "operation": "toJson",
    "csvInput": "={{ $node['file_trigger'].json.content }}"
  }
},
{
  "id": "loop_rows",
  "name": "Loop Each Row",
  "type": "n8n-nodes-base.loop",
  "parameters": {
    "input": "={{ $node['parse_csv'].json }}"
  }
}
```

---

## 7. Estructura para Integrar Todos los Disparadores

```
┌─────────────────┐
│ WhatsApp        │
└────────┬────────┘
         │
┌────────▼────────┐
│ Email           │
├─────────────────┤
│ Set Variables   │  ← Normalizar a formato común
│ (obra_id,       │
│  monto,         │
│  tipo_trans,    │
│  associated)    │
└────────┬────────┘
         │
┌────────▼────────────────────┐
│ Crear Transacción API       │  ← Único punto de integración
│ POST /api/transacciones     │
└────────┬────────────────────┘
         │
┌────────▼────────┐
│ Check Success   │
├─────────────────┤
│ ├─ True  →      │
│ │  Responder    │
│ │  en canal     │
│ │              │
│ └─ False →      │
│    Error        │
└─────────────────┘
```

---

## 8. Decisión: ¿Qué Disparador Usar?

| Canal | Complejidad | Mejor para |
|-------|-------------|-----------|
| **WhatsApp** | Baja | Clientes finales, uso móvil |
| **Email** | Media | Oficina/despacho, auditoría |
| **Slack** | Media | Equipo interna, integración laboral |
| **Formulario Web** | Media | Portal interno, dashboard |
| **Google Sheets** | Baja | Carga masiva, importación |
| **Telegram** | Baja | Notificaciones, conversacional |
| **CSV** | Media | Integración con sistemas legacy |

---

## 9. Pasos para Agregar un Nuevo Disparador

1. **Crear nodo trigger** específico (WhatsApp, Email, etc.)
2. **Extraer datos** del formato original
3. **Normalizar** a variables estándar:
   - `obra_id` (número)
   - `tipo_transaccion` (PAGO/COBRO)
   - `associated_id` (número)
   - `associated_type` (CLIENTE/PROVEEDOR)
   - `monto` (decimal)
   - `forma_pago` (opcional)
   - `concepto` (opcional)
4. **Conectar** a nodo **"Set Variables"**
5. **Continuar** hacia **"Crear Transacción API"**
6. **Responder** en el canal original

---

## 10. Testing Multi-Disparador

```bash
# Test WhatsApp
curl -X POST http://localhost:5678/webhook/whatsapp \
  -d '{"phone_number":"5491123456789","message_data":{...}}'

# Test Email
# Enviar email a: transacciones@sgo.local

# Test Slack
# Enviar comando: /transaccion obra=1 ...

# Test Formulario
# POST a https://localhost:5678/webhook/formulario-transacciones

# Test GSheets
# Agregar fila a hoja compartida
```

---

**Nota**: Todos los disparadores convergen en un único nodo de API, facilitando mantenimiento y auditoría.
