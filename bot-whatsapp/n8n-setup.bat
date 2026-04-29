@echo off
REM ===================================
REM N8N Setup para Windows
REM ===================================
REM Este script configura n8n automaticamente en Windows

setlocal enabledelayedexpansion

REM Colores (simulados con etiquetas)
cls
echo.
echo ========================================
echo N8N Setup - SGO Transacciones
echo ========================================
echo.

REM ========================
REM 1. Validar requisitos
REM ========================
echo [1/5] Validando requisitos...
echo.

REM Verificar Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker no encontrado. Instala Docker Desktop primero.
    echo.
    echo Descarga: https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)
echo [OK] Docker detectado

REM Verificar Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Compose no encontrado.
    echo.
    pause
    exit /b 1
)
echo [OK] Docker Compose detectado
echo.

REM ========================
REM 2. Crear archivo .env.n8n
REM ========================
echo [2/5] Configurando variables de entorno...
echo.

set ENV_FILE=.env.n8n

if exist "%ENV_FILE%" (
    echo [!] Archivo %ENV_FILE% ya existe. Usando configuracion existente.
) else (
    (
        echo # =======================
        echo # N8N Environment Variables
        echo # =======================
        echo.
        echo # N8N Core
        echo N8N_HOST=0.0.0.0
        echo N8N_PORT=5678
        echo N8N_TIMEZONE=America/Argentina/Buenos_Aires
        echo N8N_DEFAULT_LANGUAGE=es
        echo N8N_EDITOR_BASE_URL=http://localhost:5678/
        echo N8N_WEBHOOK_URL=http://localhost:5678
        echo.
        echo # Database
        echo DB_TYPE=sqlite
        echo DB_SQLITE_PATH=/data/n8n.sqlite3
        echo.
        echo # Security (CAMBIAR ESTOS VALORES)
        echo N8N_USER_MANAGEMENT_JWT_SECRET=super_secret_jwt_key_change_this_123456
        echo N8N_ENCRYPTION_KEY=super_secret_encryption_key_change_this_98765
        echo.
        echo # API
        echo N8N_API_ENABLED=true
        echo.
        echo # =======================
        echo # WhatsApp
        echo # =======================
        echo WHATSAPP_WEBHOOK_URL=https://api.whatsapp.com/send
        echo WHATSAPP_API_TOKEN=your_whatsapp_token_here
        echo WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_id_here
        echo.
        echo # =======================
        echo # Email (IMAP)
        echo # =======================
        echo IMAP_HOST=mail.sgo.local
        echo IMAP_PORT=993
        echo EMAIL_USER=transacciones@sgo.local
        echo EMAIL_PASSWORD=your_email_password_here
        echo.
        echo # =======================
        echo # Slack
        echo # =======================
        echo SLACK_BOT_TOKEN=xoxb-your-slack-token
        echo SLACK_SIGNING_SECRET=your-slack-signing-secret
        echo.
        echo # =======================
        echo # Google Services
        echo # =======================
        echo GSHEETS_ID=your-spreadsheet-id
        echo GSHEETS_API_KEY=your-google-api-key
        echo.
        echo # =======================
        echo # Telegram
        echo # =======================
        echo TELEGRAM_BOT_TOKEN=your-telegram-bot-token
        echo.
        echo # =======================
        echo # MinIO
        echo # =======================
        echo MINIO_URL=http://minio:9000
        echo MINIO_ACCESS_KEY=minioadmin
        echo MINIO_SECRET_KEY=minioadmin
        echo MINIO_BUCKET=sgo-transacciones
        echo.
        echo # =======================
        echo # SGO Services
        echo # =======================
        echo API_GATEWAY_URL=http://api-gateway:8080
        echo TRANSACCIONES_SERVICE_URL=http://transacciones-service:8086
        echo OBRAS_SERVICE_URL=http://obras-service:8081
        echo CLIENTES_SERVICE_URL=http://clientes-service:8082
        echo PROVEEDORES_SERVICE_URL=http://proveedores-service:8083
        echo.
        echo # =======================
        echo # Frontend
        echo # =======================
        echo DASHBOARD_URL=http://localhost:4200
        echo.
        echo # =======================
        echo # Logging
        echo # =======================
        echo LOG_LEVEL=info
    ) > "%ENV_FILE%"

    echo [OK] Archivo %ENV_FILE% creado
)
echo.

REM ========================
REM 3. Mostrar instrucciones finales
REM ========================
echo [3/5] Preparando archivos...
echo [OK] docker-compose.n8n.yml encontrado
echo [OK] n8n-workflow-whatsapp-transacciones.json encontrado
echo.

REM ========================
REM 4. Crear script de test
REM ========================
echo [4/5] Creando script de test...

if exist "test-webhook.bat" (
    echo [!] test-webhook.bat ya existe
) else (
    (
        echo @echo off
        echo setlocal enabledelayedexpansion
        echo.
        echo echo Testando webhook de WhatsApp...
        echo.
        echo set WEBHOOK_URL=http://localhost:5678/webhook/whatsapp-transacciones
        echo if not "%%1"=="" set WEBHOOK_URL=%%1
        echo.
        echo curl -X POST "!WEBHOOK_URL!" ^
        echo   -H "Content-Type: application/json" ^
        echo   -d "{\"phone_number\": \"5491123456789\", \"message_type\": \"transaccion\", \"message_data\": {\"obra_id\": 1, \"tipo_transaccion\": \"pago\", \"associated_id\": 5, \"associated_type\": \"CLIENTE\", \"monto\": 5000.00, \"forma_pago\": \"Transferencia\", \"concepto\": \"Test desde script\"}}"
        echo.
        echo echo.
        echo echo [OK] Webhook testeado
        echo pause
    ) > test-webhook.bat
    echo [OK] test-webhook.bat creado
)
echo.

REM ========================
REM 5. Instrucciones finales
REM ========================
echo ========================================
echo [OK] Setup completado!
echo ========================================
echo.
echo PROXIMOS PASOS:
echo.
echo 1. Edita el archivo .env.n8n con tus credenciales:
echo    - Abre: .env.n8n
echo    - Actualiza los valores de WHATSAPP_*
echo    - Guarda (Ctrl+S)
echo.
echo 2. Inicia n8n con:
echo    docker-compose -f docker-compose.n8n.yml up -d
echo.
echo 3. Espera 30 segundos y abre:
echo    http://localhost:5678
echo.
echo 4. Importa el workflow:
echo    - Workflows -> Import from JSON
echo    - Selecciona: n8n-workflow-whatsapp-transacciones.json
echo    - Click Import
echo.
echo 5. Testea con:
echo    test-webhook.bat
echo.
echo DOCUMENTACION:
echo - Inicio rapido:        README-N8N.md
echo - Manual completo:      docs-n8n-workflow.md
echo - Arquitectura:         n8n-workflow-diagram.md
echo - Disparadores extras:  n8n-disparadores-adicionales.md
echo - Checklist:            N8N-CHECKLIST.md
echo.
echo SOPORTE:
echo - Logs: docker logs sgo_n8n -f
echo - Dashboard: http://localhost:5678
echo.
pause
