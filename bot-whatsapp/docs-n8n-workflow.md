# Workflow n8n: WhatsApp → Transacciones SGO

**Propósito**: Crear transacciones (pagos/cobros) desde WhatsApp directamente al sistema.

**Archivo importable**: `n8n-workflow-whatsapp-transacciones.json`

---

## 1. Flujo General

```
WhatsApp Webhook
    ↓
Validar datos (obra, monto, tipo, asociado)
    ↓
Enviar a API de transacciones (POST /api/transacciones)
    ↓
Responder al cliente en WhatsApp (éxito o error)
```

---

## 2. Estructura del Payload Esperado desde WhatsApp

El webhook espera recibir un JSON como este:

```json
{
  "phone_number": "5491123456789",
  "message_type": "transaccion",
  "message_data": {
    "obra_id": 1,
    "tipo_transaccion": "pago",
    "associated_id": 5,
    "associated_type": "CLIENTE",
    "monto": 5000.00,
    "forma_pago": "Transferencia",
    "concepto": "Pago parcial por hormigonado",
    "archivo_url": "https://..."
  }
}
```

### Campos Requeridos:

| Campo | Tipo | Ejemplo | Nota |
|-------|------|---------|------|
| `phone_number` | String | "5491123456789" | Número del cliente en WhatsApp |
| `obra_id` | Int | 1 | ID de la obra en la BD |
| `tipo_transaccion` | String | "pago" o "cobro" | PAGO o COBRO (convertir a mayúscula en workflow) |
| `associated_id` | Int | 5 | ID del cliente o proveedor |
| `associated_type` | String | "CLIENTE" o "PROVEEDOR" | Tipo de asociado |
| `monto` | Float | 5000.00 | Monto de la transacción |

### Campos Opcionales:

| Campo | Tipo | Default |
|-------|------|---------|
| `forma_pago` | String | "Efectivo" |
| `concepto` | String | "Movimiento desde WhatsApp Bot" |
| `archivo_url` | String | null |

---

## 3. Configuración Inicial en n8n

### Paso 1: Importar el Workflow

1. Abre n8n en `http://localhost:5678`
2. Click en **Workflows** → **Import from JSON**
3. Copia el contenido de `n8n-workflow-whatsapp-transacciones.json`
4. Click en **Import**

### Paso 2: Configurar Variables de Entorno

En **Settings** → **Environment** del workflow, define:

```
WHATSAPP_WEBHOOK_URL=https://api.whatsapp.com/send  # o tu proveedor
WHATSAPP_API_TOKEN=xxx
API_GATEWAY_URL=http://api-gateway:8080
```

### Paso 3: Obtener URL del Webhook

Una vez importado, ve al nodo **"Webhook WhatsApp"** y copia su URL:

```
https://your-n8n-instance.com/webhook/xxx
```

Esta URL es donde **tu proveedor de WhatsApp** enviará los mensajes.

---

## 4. Configuración del Proveedor WhatsApp

Registra el webhook en tu proveedor (Twilio, Wassenger, Baileys, etc.):

```bash
# Ejemplo con Twilio:
curl -X POST https://api.twilio.com/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "url=https://your-n8n-instance.com/webhook/xxx" \
  -d "event_types=message.received"
```

---

## 5. Nodos y Lógica del Workflow

### **Webhook WhatsApp** (Trigger)
- Escucha mensajes entrantes
- Extrae `phone_number` y `message_data`

### **Nodos de Entrada** (Extracción de Datos)
- `Input Obra`: Obtiene `obra_id`
- `Input Monto`: Obtiene `monto`
- `Input Forma Pago`: Obtiene `forma_pago` (default: "Efectivo")
- `Input Concepto`: Obtiene `concepto`

### **Nodos de Configuración** (Set)
- `Set Obra`: Asigna el `id_obra` para la API
- `Select Tipo`: Convierte "pago"/"cobro" → "PAGO"/"COBRO"
- `Set Cliente/Proveedor`: Asigna `id_asociado` y `tipo_asociado`

### **Crear Transacción API**
- POST a `http://api-gateway:8080/api/transacciones`
- Body:
```json
{
  "id_obra": 1,
  "id_asociado": 5,
  "tipo_asociado": "CLIENTE",
  "tipo_transaccion": "PAGO",
  "fecha": "2026-04-29",
  "monto": 5000.00,
  "forma_pago": "Transferencia",
  "medio_pago": "WhatsApp Bot",
  "concepto": "Pago parcial por hormigonado",
  "factura_cobrada": false,
  "activo": true
}
```

### **Check Success**
- Valida si `id` en la respuesta no es null
- True → Enviar respuesta de éxito
- False → Enviar error

### **Enviar Respuesta WhatsApp**
- POST al webhook del proveedor
- Mensaje de éxito con ID y monto

### **Enviar Error WhatsApp**
- POST al webhook del proveedor
- Mensaje de error con detalles

---

## 6. Flujos de Disparadores Adicionales (Futuros)

### Para agregar más disparadores, crea nodos paralelos:

#### **Disparador: Email**
```
Email Trigger → Parse Email → Set Variables → Crear Transacción API
```

#### **Disparador: Formulario Web**
```
HTTP POST → Validar Datos → Set Variables → Crear Transacción API
```

#### **Disparador: Slack**
```
Slack Bot → Parse Mensaje → Set Variables → Crear Transacción API
```

**Patrón**: Todos convergen en **"Crear Transacción API"** y luego en **"Check Success"**.

---

## 7. Testeo Local

### Opción 1: Simular desde Postman

```bash
curl -X POST http://localhost:5678/webhook/whatsapp-transacciones \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "5491123456789",
    "message_type": "transaccion",
    "message_data": {
      "obra_id": 1,
      "tipo_transaccion": "pago",
      "associated_id": 5,
      "associated_type": "CLIENTE",
      "monto": 5000.00,
      "forma_pago": "Transferencia",
      "concepto": "Test desde Postman"
    }
  }'
```

### Opción 2: Desde un Bot de WhatsApp Test

Si usas **Baileys** o **Twilio Sandbox**:
```
Usuario: /transaccion obra=1 tipo=pago asociado=5:CLIENTE monto=5000
```

---

## 8. Integración con Obsidian

Cuando se crea una transacción exitosamente:

1. El workflow puede hacer **POST** a otro webhook que dispare un agente en Claude
2. El agente crea una nota en Obsidian: `Transacciones/2026-04-29 - Transacción #XXX.md`
3. Incluye: obra, cliente/proveedor, monto, concepto

**Nodo adicional** (opcional):
```json
{
  "name": "Log to Obsidian",
  "type": "n8n-nodes-base.httpRequest",
  "url": "http://tu-servicio-obsidian/api/note",
  "body": {
    "title": "Transacción {{ $node['Crear Transacción API'].json.id }}",
    "content": "..."
  }
}
```

---

## 9. Manejo de Errores

### Casos Contemplados:

1. **API Timeout**: Reintentar 3 veces con backoff exponencial
   - Agregar nodo **"Retry"** en el workflow

2. **Obra No Existe**: La API retorna 404
   - El workflow lo detecta en "Check Success"
   - Responde al cliente: "La obra no existe en el sistema"

3. **Cliente/Proveedor Inválido**: similar al anterior

4. **Monto Negativo**: Validar en el nodo **"Check Success"**
   - Agregar condición: `$node['Input Monto'].json.monto > 0`

### Mejora Sugerida:

Agregar nodo **"Error Handler"** antes de "Crear Transacción API":

```json
{
  "name": "Validate Before API",
  "type": "n8n-nodes-base.if",
  "conditions": [
    { "value1": "{{ $node['Input Monto'].json.monto }}", "operator": ">", "value2": "0" },
    { "value1": "{{ $node['Select Cliente/Proveedor'].json.associated_id }}", "operator": "notEmpty" }
  ]
}
```

---

## 10. Variables Globales (Referencia)

En el workflow se usan estas variables:

```javascript
// Valores del webhook
$node['Webhook WhatsApp'].json.phone_number
$node['Webhook WhatsApp'].json.message_data

// Datos extraídos
$node['Input Monto'].json.monto
$node['Input Concepto'].json.concepto
$node['Select Tipo'].json.tipo_transaccion

// Respuesta de la API
$node['Crear Transacción API'].json.id
$node['Crear Transacción API'].json.message  // si hay error
```

---

## 11. Checklist de Implementación

- [ ] Importar `n8n-workflow-whatsapp-transacciones.json`
- [ ] Configurar variables de entorno (WHATSAPP_WEBHOOK_URL, WHATSAPP_API_TOKEN)
- [ ] Obtener URL del webhook y registrarla en tu proveedor de WhatsApp
- [ ] Testear con Postman o Twilio Sandbox
- [ ] Verificar que la API de transacciones responde (GET /api/transacciones)
- [ ] Validar que los mensajes llegan a WhatsApp
- [ ] Monitorear logs en n8n para depurar
- [ ] (Futuro) Agregar disparadores adicionales (Email, Slack, Formulario Web)

---

## 12. Logs y Debugging

### En n8n:

1. Abre el workflow → **View** → **Execution History**
2. Haz clic en la ejecución que quieras revisar
3. Expande cada nodo para ver inputs/outputs

### En Consola:

```bash
# Ver logs del contenedor n8n
docker logs sgo_n8n

# Buscar errores de transacción
docker logs sgo_transacciones-service | grep -i "error"
```

---

## 13. Próximos Pasos

1. **Guardar Adjuntos**: Integrar con MinIO para subir archivos
   ```json
   "archivo_url": "minio://bucket/transacciones/2026-04-29/xxx"
   ```

2. **Estados Conversacionales**: Usar `n8n-nodes-base.respondToWebhook` para multi-step
   - Cliente responde → Workflow continúa con siguiente pregunta

3. **Notificaciones a Obras**: POST a webhook cuando se crea transacción
   - Notificar al responsable de obra

4. **Reconciliación**: Cron job diario que verifique transacciones pendientes

---

**Última actualización**: 2026-04-29
**Versión del workflow**: 1.0
**Estado**: Listo para producción
