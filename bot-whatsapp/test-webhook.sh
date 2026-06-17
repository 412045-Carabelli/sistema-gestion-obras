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
