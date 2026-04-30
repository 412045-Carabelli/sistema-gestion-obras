# ===================================
# N8N Setup para Windows PowerShell
# ===================================
#
# COMO EJECUTAR:
# 1. Abre PowerShell como administrador
# 2. cd C:\Users\Usuario\Desktop\my-work\sistema-gestion-obras\bot-whatsapp
# 3. Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# 4. .\n8n-setup.ps1

param(
    [switch]$Help
)

if ($Help) {
    Write-Host "N8N Setup para Windows"
    Write-Host ""
    Write-Host "Uso: .\n8n-setup.ps1"
    Write-Host ""
    Write-Host "Opciones:"
    Write-Host "  -Help    Mostrar esta ayuda"
    exit 0
}

# Colores
$Success = "Green"
$Error = "Red"
$Warning = "Yellow"
$Info = "Cyan"

Write-Host ""
Write-Host "========================================" -ForegroundColor $Info
Write-Host "N8N Setup - SGO Transacciones" -ForegroundColor $Info
Write-Host "========================================" -ForegroundColor $Info
Write-Host ""

# ========================
# 1. Validar requisitos
# ========================
Write-Host "[1/5] Validando requisitos..." -ForegroundColor $Info
Write-Host ""

# Verificar Docker
try {
    docker --version | Out-Null
    Write-Host "[✓] Docker detectado" -ForegroundColor $Success
} catch {
    Write-Host "[✗] Docker no encontrado. Instala Docker Desktop primero." -ForegroundColor $Error
    Write-Host "Descarga: https://www.docker.com/products/docker-desktop" -ForegroundColor $Warning
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Verificar Docker Compose
try {
    docker-compose --version | Out-Null
    Write-Host "[✓] Docker Compose detectado" -ForegroundColor $Success
} catch {
    Write-Host "[✗] Docker Compose no encontrado." -ForegroundColor $Error
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""

# ========================
# 2. Crear archivo .env.n8n
# ========================
Write-Host "[2/5] Configurando variables de entorno..." -ForegroundColor $Info
Write-Host ""

$EnvFile = ".env.n8n"

if (Test-Path $EnvFile) {
    Write-Host "[!] Archivo $EnvFile ya existe. Usando configuracion existente." -ForegroundColor $Warning
} else {
    $EnvContent = @"
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

# Database
DB_TYPE=sqlite
DB_SQLITE_PATH=/data/n8n.sqlite3

# Security (CAMBIAR ESTOS VALORES)
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
# MinIO
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
# Frontend
# =======================
DASHBOARD_URL=http://localhost:4200

# =======================
# Logging
# =======================
LOG_LEVEL=info
"@

    Set-Content -Path $EnvFile -Value $EnvContent
    Write-Host "[✓] Archivo $EnvFile creado" -ForegroundColor $Success
}

Write-Host ""

# ========================
# 3. Verificar archivos
# ========================
Write-Host "[3/5] Preparando archivos..." -ForegroundColor $Info

if (Test-Path "docker-compose.n8n.yml") {
    Write-Host "[✓] docker-compose.n8n.yml encontrado" -ForegroundColor $Success
} else {
    Write-Host "[!] docker-compose.n8n.yml NO encontrado" -ForegroundColor $Warning
}

if (Test-Path "n8n-workflow-whatsapp-transacciones.json") {
    Write-Host "[✓] n8n-workflow-whatsapp-transacciones.json encontrado" -ForegroundColor $Success
} else {
    Write-Host "[!] n8n-workflow-whatsapp-transacciones.json NO encontrado" -ForegroundColor $Warning
}

Write-Host ""

# ========================
# 4. Crear script de test
# ========================
Write-Host "[4/5] Creando script de test..." -ForegroundColor $Info

if (Test-Path "test-webhook.bat") {
    Write-Host "[!] test-webhook.bat ya existe" -ForegroundColor $Warning
} else {
    $TestScript = '@echo off' + "`r`n" + `
        'setlocal enabledelayedexpansion' + "`r`n" + `
        'echo.' + "`r`n" + `
        'echo Testando webhook de WhatsApp...' + "`r`n" + `
        'echo.' + "`r`n" + `
        'set WEBHOOK_URL=http://localhost:5678/webhook/whatsapp-transacciones' + "`r`n" + `
        'if not "%%1"=="" set WEBHOOK_URL=%%1' + "`r`n" + `
        'echo.' + "`r`n" + `
        'curl -X POST "!WEBHOOK_URL!" -H "Content-Type: application/json" -d "{\"phone_number\": \"5491123456789\", \"message_data\": {\"obra_id\": 1, \"tipo_transaccion\": \"pago\", \"associated_id\": 5, \"associated_type\": \"CLIENTE\", \"monto\": 5000.00, \"concepto\": \"Test\"}}"' + "`r`n" + `
        'echo.' + "`r`n" + `
        'echo [OK] Webhook testeado' + "`r`n" + `
        'pause'

    Set-Content -Path "test-webhook.bat" -Value $TestScript
    Write-Host "[✓] test-webhook.bat creado" -ForegroundColor $Success
}

Write-Host ""

# ========================
# 5. Instrucciones finales
# ========================
Write-Host "========================================" -ForegroundColor $Success
Write-Host "[✓] Setup completado!" -ForegroundColor $Success
Write-Host "========================================" -ForegroundColor $Success
Write-Host ""
Write-Host "PROXIMOS PASOS:" -ForegroundColor $Info
Write-Host ""
Write-Host "1. Edita el archivo .env.n8n con tus credenciales:" -ForegroundColor $Info
Write-Host "   - Abre: .env.n8n" -ForegroundColor $Info
Write-Host "   - Actualiza: WHATSAPP_WEBHOOK_URL, WHATSAPP_API_TOKEN, WHATSAPP_BUSINESS_ACCOUNT_ID" -ForegroundColor $Info
Write-Host "   - Guarda (Ctrl+S)" -ForegroundColor $Info
Write-Host ""
Write-Host "2. Inicia n8n con:" -ForegroundColor $Info
Write-Host "   docker-compose -f docker-compose.n8n.yml up -d" -ForegroundColor $Info
Write-Host ""
Write-Host "3. Espera 30 segundos y abre:" -ForegroundColor $Info
Write-Host "   http://localhost:5678" -ForegroundColor $Info
Write-Host ""
Write-Host "4. Importa el workflow:" -ForegroundColor $Info
Write-Host "   - Workflows -> Import from JSON" -ForegroundColor $Info
Write-Host "   - Selecciona: n8n-workflow-whatsapp-transacciones.json" -ForegroundColor $Info
Write-Host "   - Click Import" -ForegroundColor $Info
Write-Host ""
Write-Host "5. Testea con:" -ForegroundColor $Info
Write-Host "   .\test-webhook.bat" -ForegroundColor $Info
Write-Host ""
Write-Host "DOCUMENTACION:" -ForegroundColor $Info
Write-Host "- Inicio rapido:         README-N8N.md" -ForegroundColor $Info
Write-Host "- Manual completo:       docs-n8n-workflow.md" -ForegroundColor $Info
Write-Host "- Arquitectura:          n8n-workflow-diagram.md" -ForegroundColor $Info
Write-Host "- Disparadores extras:   n8n-disparadores-adicionales.md" -ForegroundColor $Info
Write-Host "- Checklist:             N8N-CHECKLIST.md" -ForegroundColor $Info
Write-Host ""
Write-Host "SOPORTE:" -ForegroundColor $Info
Write-Host "- Logs: docker logs sgo_n8n -f" -ForegroundColor $Info
Write-Host "- Dashboard: http://localhost:5678" -ForegroundColor $Info
Write-Host ""

Read-Host "Presiona Enter para terminar"
