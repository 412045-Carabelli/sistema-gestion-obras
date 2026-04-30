@echo off
setlocal enabledelayedexpansion

echo Testando webhook de WhatsApp...

set WEBHOOK_URL=http://localhost:5678/webhook/whatsapp-transacciones
if not "%1"=="" set WEBHOOK_URL=%1

curl -X POST ""         echo   -H "Content-Type: application/json"         echo   -d "{\"phone_number\": \"5491123456789\", \"message_type\": \"transaccion\", \"message_data\": {\"obra_id\": 1, \"tipo_transaccion\": \"pago\", \"associated_id\": 5, \"associated_type\": \"CLIENTE\", \"monto\": 5000.00, \"forma_pago\": \"Transferencia\", \"concepto\": \"Test desde script\"}}"

echo.
echo [OK] Webhook testeado
pause
