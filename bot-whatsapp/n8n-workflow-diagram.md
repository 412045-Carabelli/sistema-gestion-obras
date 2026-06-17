# Workflow N8N - Diagrama Visual y Arquitectura

## Diagrama de Flujo Principal (WhatsApp)

```mermaid
flowchart TD
    A["📱 WhatsApp Webhook<br/>(Cliente envía mensaje)"] -->|phone_number,<br/>message_data| B["🔧 Extraer Datos<br/>Input Obra<br/>Input Monto<br/>Input Forma Pago"]

    B -->|datos brutos| C["⚙️ Normalizar<br/>Select Tipo<br/>Set Cliente/Proveedor"]

    C -->|campos standarizados| D["🚀 Crear Transacción API<br/>POST /api/transacciones<br/>transacciones-service:8086"]

    D -->|respuesta API| E{"✅ Success?"}

    E -->|id ≠ null| F["✔️ Check Success TRUE"]
    E -->|error| G["✘ Check Success FALSE"]

    F --> H["📤 Enviar Respuesta<br/>WhatsApp"]
    G --> I["📤 Enviar Error<br/>WhatsApp"]

    H --> J["✅ Transacción Creada<br/>ID: xxx<br/>Monto: $xxx"]
    I --> K["❌ Error al Crear<br/>Motivo: ..."]

    style A fill:#25D366,stroke:#000,color:#fff
    style D fill:#FF6B6B,stroke:#000,color:#fff
    style J fill:#4ECDC4,stroke:#000,color:#fff
    style K fill:#FF6B6B,stroke:#000,color:#fff
```

---

## Diagrama Multi-Disparador

```mermaid
flowchart TD
    WA["📱 WhatsApp Webhook"]
    EMAIL["📧 Email (IMAP)"]
    SLACK["💬 Slack Command"]
    FORM["🌐 Formulario Web"]
    SHEET["📊 Google Sheets"]

    WA --> EXT1["Extraer:<br/>phone, message_data"]
    EMAIL --> EXT2["Extraer:<br/>subject, body"]
    SLACK --> EXT3["Extraer:<br/>command text"]
    FORM --> EXT4["Extraer:<br/>FormData JSON"]
    SHEET --> EXT5["Extraer:<br/>row cells"]

    EXT1 --> NORM["⚙️ NORMALIZAR<br/>obra_id<br/>tipo_transaccion<br/>associated_id<br/>associated_type<br/>monto<br/>concepto"]
    EXT2 --> NORM
    EXT3 --> NORM
    EXT4 --> NORM
    EXT5 --> NORM

    NORM --> API["🚀 API ÚNICA<br/>POST /api/transacciones"]

    API --> CHECK{"Status 200<br/>+ id?"}

    CHECK -->|YES| SUCCESS["Responder en<br/>canal original<br/>✅ Éxito"]
    CHECK -->|NO| ERROR["Responder en<br/>canal original<br/>❌ Error"]

    SUCCESS --> WA_RESP["📱 WhatsApp"]
    SUCCESS --> EMAIL_RESP["📧 Email"]
    SUCCESS --> SLACK_RESP["💬 Slack"]
    SUCCESS --> FORM_RESP["🌐 Formulario"]
    SUCCESS --> SHEET_RESP["📊 GSheets"]

    ERROR --> WA_RESP
    ERROR --> EMAIL_RESP
    ERROR --> SLACK_RESP
    ERROR --> FORM_RESP
    ERROR --> SHEET_RESP

    style NORM fill:#9B59B6,stroke:#000,color:#fff
    style API fill:#FF6B6B,stroke:#000,color:#fff
    style SUCCESS fill:#27AE60,stroke:#000,color:#fff
    style ERROR fill:#E74C3C,stroke:#000,color:#fff
```

---

## Diagrama de Integración con Servicios

```mermaid
graph LR
    N8N["🎯 N8N<br/>Workflows"]

    subgraph "Disparadores"
        WA["WhatsApp"]
        EMAIL["Email"]
        SLACK["Slack"]
    end

    subgraph "Servicios SGO"
        GATEWAY["API Gateway<br/>8080"]
        TRANS["Transacciones<br/>8086"]
        OBRAS["Obras<br/>8081"]
        CLIENTES["Clientes<br/>8082"]
        PROV["Proveedores<br/>8083"]
    end

    subgraph "BD"
        SQLSERVER["SQL Server<br/>1433"]
    end

    subgraph "Respuestas"
        WA_OUT["📱 WhatsApp"]
        EMAIL_OUT["📧 Email"]
        SLACK_OUT["💬 Slack"]
    end

    WA --> N8N
    EMAIL --> N8N
    SLACK --> N8N

    N8N -->|POST /api/transacciones| GATEWAY
    GATEWAY -->|forward| TRANS

    TRANS -->|GET clientes| CLIENTES
    TRANS -->|GET proveedores| PROV
    TRANS -->|GET obras| OBRAS

    CLIENTES --> SQLSERVER
    PROV --> SQLSERVER
    OBRAS --> SQLSERVER

    TRANS -->|INSERT/UPDATE<br/>transacciones| SQLSERVER

    N8N -->|respuesta| WA_OUT
    N8N -->|respuesta| EMAIL_OUT
    N8N -->|respuesta| SLACK_OUT

    style N8N fill:#FF6B6B,stroke:#000,color:#fff
    style GATEWAY fill:#F39C12,stroke:#000,color:#fff
    style SQLSERVER fill:#3498DB,stroke:#000,color:#fff
```

---

## Secuencia Temporal: WhatsApp Flow

```mermaid
sequenceDiagram
    participant Client as 👤 Cliente
    participant WA as 📱 WhatsApp API
    participant N8N as 🎯 N8N
    participant Gateway as 🚪 API Gateway
    participant Trans as 💾 Transacciones
    participant DB as 🗄️ SQL Server

    Client->>WA: Envía mensaje con datos
    WA->>N8N: Webhook POST
    N8N->>N8N: Parse y Normalizar datos
    N8N->>Gateway: POST /api/transacciones
    Gateway->>Trans: Forward request
    Trans->>Trans: Validar datos
    Trans->>DB: INSERT transaccion
    DB->>DB: Commit
    DB-->>Trans: ✅ OK (id=123)
    Trans-->>Gateway: 200 + TransaccionDto
    Gateway-->>N8N: Response
    N8N->>N8N: Check Success
    N8N->>WA: POST send_message
    WA->>Client: ✅ Transacción #123 creada
    Client->>Client: Lee confirmación
```

---

## Variables de Entorno Requeridas

```bash
# .env para n8n

# WhatsApp
WHATSAPP_WEBHOOK_URL=https://api.whatsapp.com/send
WHATSAPP_API_TOKEN=xxx_your_token_xxx
WHATSAPP_BUSINESS_ACCOUNT_ID=xxx

# Email (IMAP)
IMAP_HOST=mail.sgo.local
IMAP_PORT=993
EMAIL_USER=transacciones@sgo.local
EMAIL_PASSWORD=xxx

# Slack
SLACK_BOT_TOKEN=xoxb-xxx
SLACK_SIGNING_SECRET=xxx

# Google Sheets
GSHEETS_ID=xxx_spreadsheet_id_xxx
GSHEETS_API_KEY=xxx

# Telegram
TELEGRAM_BOT_TOKEN=xxx_bot_token_xxx

# MinIO (para archivos)
MINIO_URL=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# SGO API
API_GATEWAY_URL=http://api-gateway:8080
TRANSACCIONES_SERVICE_URL=http://transacciones-service:8086

# Dashboard
DASHBOARD_URL=http://localhost:4200

# N8N
N8N_TIMEZONE=America/Argentina/Buenos_Aires
N8N_DEFAULT_LANGUAGE=es
```

---

## Base de Datos: Tabla de Auditoría N8N

```sql
-- Agregar columna a tabla transacciones para auditoría n8n
ALTER TABLE transacciones ADD COLUMN
    origen_creacion NVARCHAR(50) DEFAULT 'MANUAL';
    -- Valores: 'MANUAL', 'WHATSAPP', 'EMAIL', 'SLACK', 'FORMULARIO', 'GSHEETS'

ALTER TABLE transacciones ADD COLUMN
    id_webhook_n8n NVARCHAR(255);
    -- Para rastrear ejecución de n8n

ALTER TABLE transacciones ADD COLUMN
    telefono_cliente NVARCHAR(20);
    -- Contacto del cliente para respuestas

-- Crear tabla de log de intentos de n8n
CREATE TABLE transacciones_n8n_log (
    id BIGINT NOT NULL PRIMARY KEY IDENTITY(1,1),
    transaccion_id BIGINT,
    workflow_name NVARCHAR(255) NOT NULL,
    disparador_tipo NVARCHAR(50) NOT NULL,  -- WHATSAPP, EMAIL, etc.
    payload_entrada NVARCHAR(MAX),
    respuesta_api NVARCHAR(MAX),
    estado NVARCHAR(20) NOT NULL,  -- SUCCESS, ERROR
    mensaje_error NVARCHAR(500),
    fecha_intento DATETIME2 DEFAULT GETDATE(),

    FOREIGN KEY (transaccion_id) REFERENCES transacciones(id)
);

-- Index para búsquedas rápidas
CREATE INDEX idx_n8n_log_fecha ON transacciones_n8n_log(fecha_intento DESC);
CREATE INDEX idx_n8n_log_disparador ON transacciones_n8n_log(disparador_tipo);
```

---

## API Calls en el Workflow

### 1. Crear Transacción

```http
POST http://api-gateway:8080/api/transacciones
Content-Type: application/json

{
  "id_obra": 1,
  "id_asociado": 5,
  "tipo_asociado": "CLIENTE",
  "tipo_transaccion": "PAGO",
  "fecha": "2026-04-29",
  "monto": 5000.00,
  "forma_pago": "Transferencia",
  "medio_pago": "WhatsApp Bot",
  "concepto": "Pago hormigonado",
  "factura_cobrada": false,
  "activo": true
}

# Response (200 OK):
{
  "id": 123,
  "id_obra": 1,
  "id_asociado": 5,
  "tipo_asociado": "CLIENTE",
  "tipo_transaccion": "PAGO",
  "fecha": "2026-04-29",
  "monto": 5000.00,
  "forma_pago": "Transferencia",
  "medio_pago": "WhatsApp Bot",
  "concepto": "Pago hormigonado",
  "factura_cobrada": false,
  "activo": true,
  "creadoEn": "2026-04-29T14:30:00Z"
}
```

### 2. Obtener Clientes (para validación)

```http
GET http://api-gateway:8080/api/clientes
# Response: Array de ClienteResponse

# O filtrado:
GET http://api-gateway:8080/api/clientes?activo=true
```

### 3. Obtener Obras (para validación)

```http
GET http://api-gateway:8080/api/obras
# Response: Array de ObraResponse

# O por ID:
GET http://api-gateway:8080/api/obras/1
```

---

## Error Handling en el Workflow

```
Escenario: API retorna 400 (validación fallida)
├─ Posible Causa: Monto negativo, cliente inexistente
├─ Manejo: Log en n8n_log tabla
└─ Respuesta: "Validación fallida: ..." en WhatsApp

Escenario: API retorna 404 (recurso no encontrado)
├─ Posible Causa: Obra o cliente no existe
├─ Manejo: Log y sugerencia de verificar IDs
└─ Respuesta: "La obra/cliente no existe. Verifica los datos"

Escenario: API retorna 500 (error interno)
├─ Posible Causa: Error BD, timeout, etc.
├─ Manejo: Retry automático (max 3 veces)
└─ Respuesta: "Error interno. Intenta más tarde"

Escenario: Timeout (>30s)
├─ Manejo: Cancelar y log
└─ Respuesta: "Timeout. Verifica tu conexión"
```

---

## Monitoreo y Observabilidad

### En N8N

**Dashboard Personalizado**:
```
- Ejecuciones totales: X
- Éxitos: X (%)
- Errores: X (%)
- Tiempo promedio: X ms
- Disparador más usado: X
```

### Logs SQL

```sql
-- Contar transacciones creadas via n8n
SELECT
    disparador_tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN estado='SUCCESS' THEN 1 END) as exitosas,
    COUNT(CASE WHEN estado='ERROR' THEN 1 END) as errores,
    AVG(DATEDIFF(MILLISECOND, fecha_intento, fecha_intento)) as tiempo_ms
FROM transacciones_n8n_log
GROUP BY disparador_tipo
ORDER BY total DESC;

-- Errores del último día
SELECT * FROM transacciones_n8n_log
WHERE fecha_intento >= DATEADD(DAY, -1, GETDATE())
  AND estado = 'ERROR'
ORDER BY fecha_intento DESC;
```

---

## Integración Futura: Webhooks Bidireccionales

```mermaid
graph LR
    N8N["N8N<br/>Workflows"]

    subgraph "Bidireccional"
        TX["Transacción<br/>Creada"]
        WEBHOOK["Webhook SGO"]
    end

    subgraph "Notificaciones"
        SLACK_NOTIF["Slack"]
        OBSIDIAN["Obsidian"]
        DASHBOARD["Dashboard"]
    end

    TX -->|POST webhook| N8N
    N8N -->|procesa| WEBHOOK
    WEBHOOK -->|notifica| SLACK_NOTIF
    WEBHOOK -->|crea nota| OBSIDIAN
    WEBHOOK -->|actualiza| DASHBOARD
```

**Implementación**:
```json
{
  "id": "webhook_transaccion_creada",
  "name": "Escuchar Transacción Creada",
  "type": "n8n-nodes-base.webhookTrigger",
  "parameters": {
    "url": "http://n8n:5678/webhook/transaccion-creada",
    "httpMethod": "POST"
  }
}
```

---

## Checklist de Deployment

- [ ] Variables de entorno configuradas
- [ ] Webhook de WhatsApp registrado
- [ ] Credenciales de proveedores agregadas a n8n
- [ ] Testear cada disparador individualmente
- [ ] Validar respuestas en cada canal
- [ ] Monitorear logs del servicio de transacciones
- [ ] Crear alertas para errores
- [ ] Documentar procesos en Obsidian
- [ ] Capacitar a usuarios finales

---

**Última actualización**: 2026-04-29 | **Versión**: 1.0
