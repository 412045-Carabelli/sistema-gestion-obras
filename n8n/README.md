# SGO WhatsApp Bot — Setup n8n (v1 Consultas)

Bot de WhatsApp para consultar el Sistema de Gestión de Obras desde el celular, sin abrir la computadora. Recibe **texto o audio**, lo interpreta con **Gemini 2.0 Flash** y responde con datos del backend SGO.

**Alcance v1:** sólo consultas (lectura). Las altas/registros vienen en v2.

---

## Stack

| Componente | Tecnología |
|---|---|
| Mensajería | Meta WhatsApp Cloud API (Business) |
| Orquestación | n8n (ya en `docker-compose.yml`) |
| LLM | Google Gemini 2.0 Flash (audio nativo + intent + formateo) |
| Backend | api-gateway:8080 → microservicios SGO |

---

## Pre-requisitos

### 1. Cuenta Meta for Developers

1. Entrá a https://developers.facebook.com → **My Apps** → **Create App** → tipo **Business**.
2. Agregá el producto **WhatsApp**.
3. Anotá de la pantalla "API Setup":
   - **Phone number ID** (lo necesitarás como `WHATSAPP_PHONE_NUMBER_ID`)
   - **Temporary access token** (vence en 24 h — para producción generá un **System User token permanente** desde Business Manager)
4. Agregá tu número de celular como **recipient phone** para poder probar antes de salir a producción.

### 2. API Key de Gemini

1. Entrá a https://aistudio.google.com/app/apikey
2. **Create API key** → copiala. Va a ir en `GEMINI_API_KEY`.
3. Confirmá que el modelo `gemini-2.0-flash` está disponible en tu región (lo está en LATAM).

### 3. Túnel HTTPS público hacia n8n

Meta sólo envía webhooks a URLs **HTTPS públicas con certificado válido**. Como n8n corre en Docker en tu máquina, necesitás un túnel:

**Opción A — ngrok (rápido, gratis):**
```bash
# Instalar (Windows): https://ngrok.com/download
ngrok http 5678
# Te devuelve algo como: https://abcd-1234.ngrok-free.app
```

**Opción B — Cloudflare Tunnel (gratis, sin caducidad):**
```bash
cloudflared tunnel --url http://localhost:5678
```

Anotá la URL HTTPS pública. Tus webhooks van a ser:
- `https://<URL>/webhook/whatsapp` (mensajes y verificación)

---

## Paso 1 — Conectar n8n a la red del backend

Tu `docker-compose.yml` actual tiene a n8n en una red separada (`n8n_network`). Para que pueda llamar a `http://api-gateway:8080`, agregalo a la red `sgo_backend`:

**Editá `docker-compose.yml`** en el bloque `n8n:`:

```yaml
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - TZ=America/Argentina/Cordoba
      - DB_TYPE=mssql
      - DB_MSSQL_HOST=sqlserver
      - DB_MSSQL_PORT=1433
      - DB_MSSQL_DATABASE=n8n
      - DB_MSSQL_USER=sa
      - DB_MSSQL_PASSWORD=SgoAdmin2024!
      # === Variables del bot ===
      - WHATSAPP_VERIFY_TOKEN=${WHATSAPP_VERIFY_TOKEN}
      - WHATSAPP_ACCESS_TOKEN=${WHATSAPP_ACCESS_TOKEN}
      - WHATSAPP_PHONE_NUMBER_ID=${WHATSAPP_PHONE_NUMBER_ID}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - SGO_API_BASE=http://api-gateway:8080
      - SGO_USER_HEADER=whatsapp-bot
      # === Webhook público (la URL del túnel ngrok/cloudflared) ===
      - WEBHOOK_URL=${N8N_PUBLIC_URL}
      - N8N_EDITOR_BASE_URL=${N8N_PUBLIC_URL}
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      sqlserver:
        condition: service_healthy
    networks:
      - sgo_backend     # ← AGREGAR
      - n8n_network
    restart: unless-stopped
```

> **Nota sobre la BD:** n8n vacío necesita que la DB `n8n` exista. Si la primera vez falla, conectate con SSMS/Azure Data Studio y `CREATE DATABASE n8n;` manualmente.

---

## Paso 2 — Variables de entorno (.env)

Agregá al `.env` del proyecto (junto al `docker-compose.yml`):

```env
# Meta WhatsApp
WHATSAPP_VERIFY_TOKEN=sgo-pablo-2026-secret-token
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=1234567890

# Gemini
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxx

# n8n público (la URL del túnel)
N8N_PUBLIC_URL=https://abcd-1234.ngrok-free.app
```

El `WHATSAPP_VERIFY_TOKEN` lo inventás vos — sólo tiene que coincidir entre `.env` y lo que pongas en Meta al configurar el webhook.

---

## Paso 3 — Levantar y verificar

```bash
docker compose up -d n8n
docker compose logs -f n8n
```

Esperá a ver `Editor is now accessible via: http://localhost:5678/`. Después abrí `http://localhost:5678` y:

1. Creá la cuenta de admin (sólo la primera vez).
2. Verificá que las variables están cargadas: **Settings → Variables** debería listar las que pusiste en el compose. Si no aparecen ahí, n8n las lee igual desde `process.env`, lo que importa es que estén dentro del contenedor (`docker exec n8n printenv | grep WHATSAPP`).

---

## Paso 4 — Importar el workflow

1. En n8n: **Workflows → Import from File** (botón con tres puntos arriba a la derecha).
2. Seleccioná `SGO_WhatsApp_Bot_v1.json`.
3. Una vez importado, **activá el workflow** (toggle arriba a la derecha).
4. Click en el nodo **Webhook Mensajes (POST)** → copiá la **Production URL**. Va a ser tipo:
   `https://abcd-1234.ngrok-free.app/webhook/whatsapp`

---

## Paso 5 — Configurar el webhook en Meta

1. Volvé a developers.facebook.com → tu app → **WhatsApp → Configuration**.
2. En **Webhook**, click **Edit**:
   - **Callback URL:** `https://abcd-1234.ngrok-free.app/webhook/whatsapp`
   - **Verify token:** el mismo valor que pusiste en `WHATSAPP_VERIFY_TOKEN`
3. Click **Verify and save**. Si todo está OK, Meta hace un GET y el workflow responde con el `hub.challenge`.
4. En **Webhook fields**, suscribite a **messages**.

---

## Paso 6 — Probar

Desde tu celular (el que agregaste como recipient), mandale al número de WhatsApp Business:

| Mensaje | Lo que debería pasar |
|---|---|
| `ayuda` | Te lista las consultas disponibles |
| `dame el resumen general` | Llama a `/api/reportes/generales/resumen` y te resume |
| `últimos movimientos` | Llama a `/api/transacciones/recientes` |
| `flujo de caja` | Llama a `/api/flujo-caja/principal` |
| `qué obras tengo` | Lista de obras (top 10) |
| `cuál es el saldo del cliente Pérez` | Busca cliente "Pérez" y trae su saldo |
| `cuenta corriente de la obra Edificio Norte` | Busca obra por nombre y trae CC |
| 🎤 **audio:** "decime el saldo del proveedor Maderera Central" | Gemini transcribe + interpreta + responde |
| `quiero cargar una factura` | Bot responde que las altas no están soportadas en v1 |

Mientras probás, dejá abierto en n8n: **Executions** → vas viendo cada ejecución y en qué nodo se traba si algo falla.

---

## Mapa de intents → endpoints SGO

| Intent | Endpoint llamado | Notas |
|---|---|---|
| `resumen_general` | `GET /api/reportes/generales/resumen` | Directo |
| `flujo_caja` | `GET /api/flujo-caja/principal` | Directo |
| `movimientos_recientes` | `GET /api/transacciones/recientes` | Últimos 10 |
| `listar_obras` | `GET /api/obras` | Lista completa |
| `listar_clientes` | `GET /api/clientes` | Lista completa |
| `listar_proveedores` | `GET /api/proveedores/simple` | Sin cálculos |
| `saldo_cliente` | `GET /api/clientes` → match → `GET /api/reportes/financieros/saldos/cliente/{id}` | Lookup por nombre |
| `saldo_proveedor` | `GET /api/proveedores/simple` → match → `GET /api/reportes/financieros/saldos/proveedor/{id}` | Lookup por nombre |
| `cuenta_corriente_obra` | `GET /api/obras` → match → `GET /api/reportes/cuenta-corriente/obra/{id}` | Lookup por nombre |
| `cuenta_corriente_proveedor` | `GET /api/proveedores/simple` → match → `GET /api/reportes/cuenta-corriente/proveedor/{id}` | Lookup por nombre |
| `ayuda` | — | Texto fijo |
| `desconocido` | — | Pide reformular o avisa que v1 sólo lee |

---

## Arquitectura del workflow

```
Webhook POST /webhook/whatsapp
   ├─→ Respond 200 OK   (inmediato, Meta lo exige)
   └─→ Parse Meta Payload
         └─→ ¿Es audio?
               ├─ SÍ → Obtener URL → Descargar audio binario ─┐
               └─ NO ────────────────────────────────────────┤
                                                              ↓
                                                Preparar payload Gemini
                                                              ↓
                                         Gemini: detectar intent (JSON)
                                                              ↓
                                                     Parsear intent
                                                              ↓
                                          Resolver SGO (llamadas API)
                                                              ↓
                                              Preparar formateo Gemini
                                                              ↓
                                          Gemini: formatear respuesta
                                                              ↓
                                                  Armar reply WhatsApp
                                                              ↓
                                              Enviar respuesta WhatsApp
```

**Flujo paralelo de verificación (one-time):**

```
Webhook GET /webhook/whatsapp → Respond Verify (devuelve hub.challenge)
```

---

## Troubleshooting

| Síntoma | Causa probable | Fix |
|---|---|---|
| Meta no verifica el webhook | Token mismatch o URL mal | Que `WHATSAPP_VERIFY_TOKEN` del `.env` y de Meta coincidan exacto |
| Webhook recibe pero no responde nada | Workflow desactivado | Toggle "Active" en la esquina superior derecha |
| `getaddrinfo ENOTFOUND api-gateway` en el Resolver | n8n no está en la red `sgo_backend` | Revisar el `networks:` del compose (Paso 1) |
| Audio no se descarga | Token de WhatsApp expirado (los temporales duran 24h) | Generar System User token permanente en Business Manager |
| Gemini devuelve "PERMISSION_DENIED" | API key inválida o sin habilitar | Regenerar en aistudio.google.com |
| Respuestas mezcladas entre usuarios | Está bien, n8n procesa cada webhook como ejecución independiente | — |
| Lookup no encuentra al cliente "Perez" pero existe "Pérez" | Tildes | Mejorá el `matchByName` para normalizar (NFD + replace diacríticos) |

---

## Próximos pasos (v2)

Cuando v1 esté estable, sumamos:

- **Registro de movimientos** (`POST /api/transacciones`) con confirmación previa: el bot resume lo que entendió y espera "sí" antes de grabar.
- **Carga de facturas** con foto/PDF (Meta media → MinIO → `POST /api/facturas`).
- **Alta de cliente/proveedor/obra** con campos obligatorios validados conversacionalmente.
- **Autorización por número:** sólo aceptar mensajes de `from` whitelisteados (un Set con la lista en una variable).
- **Memoria de conversación:** guardar las últimas N interacciones en Redis para que el bot mantenga contexto ("y ahora el saldo del otro proveedor").

---

## Costos estimados

- **Meta WhatsApp:** 1.000 conversaciones de servicio gratis por mes; después ~USD 0.005 c/u en Argentina.
- **Gemini 2.0 Flash:** USD 0.10 por 1M tokens input + USD 0.40 por 1M output. Para ~50 mensajes/día (Pablo solo) → < USD 1/mes.
- **n8n self-hosted:** $0.
- **ngrok free:** $0 (con la limitación de que la URL cambia al reiniciar; con cuenta gratis tenés un subdominio fijo).

---

## Ideas para sumar después

Algunas sugerencias que aplican bien al caso de uso:

1. **Notificaciones proactivas** (no sólo bot reactivo): cron en n8n que cada mañana a las 8 le mande a Pablo un resumen del día anterior (movimientos nuevos, vencimientos próximos).
2. **Aprobación de facturas grandes**: cuando una factura supera X monto, el sistema le pregunta a Pablo por WhatsApp antes de marcarla como aprobada.
3. **Recordatorios de pagos**: el bot lee los vencimientos de cuenta corriente y avisa a Pablo 3 días antes.
4. **Multi-usuario**: agregar a tu socio/contadora con permisos limitados (sólo consultas de su dominio).
5. **Comandos slash**: `/saldos`, `/obras`, `/help` para los que prefieren texto rápido sin lenguaje natural.
