#!/bin/bash

# =======================
# N8N Setup Script para SGO
# =======================
# Este script configura n8n con el workflow de transacciones

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}N8N Setup - SGO Transacciones${NC}"
echo -e "${YELLOW}========================================${NC}"

# ========================
# 1. Validar requisitos
# ========================

echo -e "\n${YELLOW}[1/5] Validando requisitos...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no encontrado. Instala Docker primero.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose no encontrado. Instala Docker Compose primero.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker y Docker Compose detectados${NC}"

# ========================
# 2. Crear directorio .env
# ========================

echo -e "\n${YELLOW}[2/5] Configurando variables de entorno...${NC}"

ENV_FILE=".env.n8n"

if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Archivo $ENV_FILE ya existe. Usando configuración existente.${NC}"
else
    cat > "$ENV_FILE" << 'EOF'
# =======================
# N8N Environment Variables
# =======================

# N8N Core
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_TIMEZONE=America/Argentina/Buenos_Aires
N8N_DEFAULT_LANGUAGE=es
N8N_EDITOR_BASE_URL=http://localhost:5678/
N8N_WEBHOOK_URL=http://localhost:5678

# Database (PostgreSQL o SQLite)
DB_TYPE=sqlite
DB_SQLITE_PATH=/data/n8n.sqlite3

# Credenciales Admin (cambiar)
N8N_USER_MANAGEMENT_JWT_SECRET=super_secret_jwt_key_change_this_123456
N8N_ENCRYPTION_KEY=super_secret_encryption_key_change_this_98765

# API
N8N_API_ENABLED=true

# =======================
# WhatsApp
# =======================
WHATSAPP_WEBHOOK_URL=https://api.whatsapp.com/send
WHATSAPP_API_TOKEN=your_whatsapp_token_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_id_here

# =======================
# Email (IMAP)
# =======================
IMAP_HOST=mail.sgo.local
IMAP_PORT=993
EMAIL_USER=transacciones@sgo.local
EMAIL_PASSWORD=your_email_password_here

# =======================
# Slack
# =======================
SLACK_BOT_TOKEN=xoxb-your-slack-token
SLACK_SIGNING_SECRET=your-slack-signing-secret

# =======================
# Google Services
# =======================
GSHEETS_ID=your-spreadsheet-id
GSHEETS_API_KEY=your-google-api-key

# =======================
# Telegram
# =======================
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# =======================
# MinIO (Almacenamiento)
# =======================
MINIO_URL=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=sgo-transacciones

# =======================
# SGO Services
# =======================
API_GATEWAY_URL=http://api-gateway:8080
TRANSACCIONES_SERVICE_URL=http://transacciones-service:8086
OBRAS_SERVICE_URL=http://obras-service:8081
CLIENTES_SERVICE_URL=http://clientes-service:8082
PROVEEDORES_SERVICE_URL=http://proveedores-service:8083

# =======================
# Dashboard
# =======================
DASHBOARD_URL=http://localhost:4200

# =======================
# Logging
# =======================
LOG_LEVEL=info
N8N_LOG_FILE_LOCATION=/data/logs
EOF

    echo -e "${GREEN}✅ Archivo $ENV_FILE creado${NC}"
    echo -e "${YELLOW}⚠️  Asegúrate de actualizar los valores en $ENV_FILE antes de iniciar${NC}"
fi

# ========================
# 3. Crear archivo docker-compose para n8n
# ========================

echo -e "\n${YELLOW}[3/5] Creando docker-compose para n8n...${NC}"

DOCKER_COMPOSE_N8N="docker-compose.n8n.yml"

cat > "$DOCKER_COMPOSE_N8N" << 'EOF'
version: '3.9'

services:
  n8n:
    image: n8n:latest
    container_name: sgo_n8n
    restart: unless-stopped
    environment:
      - N8N_HOST=${N8N_HOST:-0.0.0.0}
      - N8N_PORT=${N8N_PORT:-5678}
      - N8N_TIMEZONE=${N8N_TIMEZONE:-America/Argentina/Buenos_Aires}
      - N8N_DEFAULT_LANGUAGE=${N8N_DEFAULT_LANGUAGE:-es}
      - DB_TYPE=${DB_TYPE:-sqlite}
      - DB_SQLITE_PATH=${DB_SQLITE_PATH:-/data/n8n.sqlite3}
      - N8N_USER_MANAGEMENT_JWT_SECRET=${N8N_USER_MANAGEMENT_JWT_SECRET}
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - N8N_API_ENABLED=${N8N_API_ENABLED:-true}
      - N8N_WEBHOOK_URL=${N8N_WEBHOOK_URL}
      - N8N_EDITOR_BASE_URL=${N8N_EDITOR_BASE_URL}
      - WHATSAPP_WEBHOOK_URL=${WHATSAPP_WEBHOOK_URL}
      - WHATSAPP_API_TOKEN=${WHATSAPP_API_TOKEN}
      - WHATSAPP_BUSINESS_ACCOUNT_ID=${WHATSAPP_BUSINESS_ACCOUNT_ID}
      - IMAP_HOST=${IMAP_HOST}
      - IMAP_PORT=${IMAP_PORT:-993}
      - EMAIL_USER=${EMAIL_USER}
      - EMAIL_PASSWORD=${EMAIL_PASSWORD}
      - SLACK_BOT_TOKEN=${SLACK_BOT_TOKEN}
      - SLACK_SIGNING_SECRET=${SLACK_SIGNING_SECRET}
      - GSHEETS_ID=${GSHEETS_ID}
      - GSHEETS_API_KEY=${GSHEETS_API_KEY}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - MINIO_URL=${MINIO_URL}
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - MINIO_BUCKET=${MINIO_BUCKET}
      - API_GATEWAY_URL=${API_GATEWAY_URL}
      - TRANSACCIONES_SERVICE_URL=${TRANSACCIONES_SERVICE_URL}
      - DASHBOARD_URL=${DASHBOARD_URL}
      - LOG_LEVEL=${LOG_LEVEL:-info}
    ports:
      - "${N8N_PORT:-5678}:${N8N_PORT:-5678}"
    volumes:
      - n8n_data:/data
      - ./logs:/data/logs
    networks:
      - sgo_backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5678/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    depends_on:
      - api-gateway

  # PostgreSQL para N8N (opcional, más robusto que SQLite)
  # n8n_postgres:
  #   image: postgres:15-alpine
  #   container_name: sgo_n8n_postgres
  #   environment:
  #     POSTGRES_USER: n8n_user
  #     POSTGRES_PASSWORD: n8n_password
  #     POSTGRES_DB: n8n_db
  #   volumes:
  #     - n8n_postgres_data:/var/lib/postgresql/data
  #   networks:
  #     - sgo_backend
  #   restart: unless-stopped

volumes:
  n8n_data:
  # n8n_postgres_data:

networks:
  sgo_backend:
    external: true
EOF

echo -e "${GREEN}✅ Archivo $DOCKER_COMPOSE_N8N creado${NC}"

# ========================
# 4. Crear archivo de webhook test
# ========================

echo -e "\n${YELLOW}[4/5] Creando script de test...${NC}"

cat > "test-webhook.sh" << 'EOF'
#!/bin/bash

echo "Testando webhook de WhatsApp..."

WEBHOOK_URL=${1:-"http://localhost:5678/webhook/whatsapp-transacciones"}

curl -X POST "$WEBHOOK_URL" \
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
      "concepto": "Test desde script"
    }
  }'

echo ""
echo "✅ Webhook testeado"
EOF

chmod +x test-webhook.sh

echo -e "${GREEN}✅ Script de test creado: test-webhook.sh${NC}"

# ========================
# 5. Instrucciones finales
# ========================

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Setup completado${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Próximos pasos:${NC}"
echo -e "1. Edita el archivo ${YELLOW}$ENV_FILE${NC} con tus credenciales reales"
echo -e "2. Inicia n8n con:"
echo -e "   ${YELLOW}docker-compose -f $DOCKER_COMPOSE_N8N up -d${NC}"
echo -e "3. Abre en navegador:"
echo -e "   ${YELLOW}http://localhost:5678${NC}"
echo -e "4. Importa el workflow:"
echo -e "   ${YELLOW}n8n-workflow-whatsapp-transacciones.json${NC}"
echo -e "5. Configura las credenciales en n8n para cada integración"
echo -e "6. Copia la URL del webhook de n8n en tu proveedor de WhatsApp"
echo -e "7. Testea con:"
echo -e "   ${YELLOW}./test-webhook.sh${NC}"

echo -e "\n${YELLOW}Documentación:${NC}"
echo -e "- Flujo principal: docs-n8n-workflow.md"
echo -e "- Disparadores adicionales: n8n-disparadores-adicionales.md"
echo -e "- Diagramas: n8n-workflow-diagram.md"

echo -e "\n${YELLOW}Soporte:${NC}"
echo -e "- Logs: docker logs sgo_n8n"
echo -e "- Dashboard: http://localhost:5678"
echo -e "- Documentación oficial: https://docs.n8n.io"

echo ""
