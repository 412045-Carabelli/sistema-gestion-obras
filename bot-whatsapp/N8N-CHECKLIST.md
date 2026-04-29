# N8N - Checklist de Implementación

## ✅ Pre-Requisitos (Antes de Empezar)

- [ ] Docker instalado y corriendo
- [ ] Docker Compose instalado
- [ ] API Gateway running en puerto 8080
- [ ] Transacciones Service running en puerto 8086
- [ ] Git clone del proyecto completado
- [ ] Acceso a credenciales de WhatsApp (o proveedor elegido)
- [ ] Cuenta de n8n creada (opcional, pero recomendado)

---

## 📁 Archivos Generados

- [ ] `n8n-workflow-whatsapp-transacciones.json` ✓ Existe
- [ ] `docs-n8n-workflow.md` ✓ Existe
- [ ] `n8n-disparadores-adicionales.md` ✓ Existe
- [ ] `n8n-workflow-diagram.md` ✓ Existe
- [ ] `n8n-setup.sh` ✓ Existe
- [ ] `README-N8N.md` ✓ Existe
- [ ] `docker-compose.n8n.yml` ✓ Existe
- [ ] `N8N-RESUMEN-EJECUTIVO.txt` ✓ Existe
- [ ] `N8N-CHECKLIST.md` ✓ Este archivo

---

## 🚀 Setup Inicial (Dia 1)

### Fase 1: Preparación (5 min)

- [ ] Leer `N8N-RESUMEN-EJECUTIVO.txt` (2 min)
- [ ] Leer `README-N8N.md` → Sección "Inicio Rápido" (3 min)

### Fase 2: Script de Setup Automatizado (10 min)

```bash
cd /path/to/sistema-gestion-obras

# Hacer script ejecutable
chmod +x n8n-setup.sh

# Ejecutar setup
./n8n-setup.sh
```

**Qué hace**:
- ✅ Valida Docker y Docker Compose
- ✅ Crea `.env.n8n` con variables de entorno
- ✅ Genera `docker-compose.n8n.yml` (si no existe)
- ✅ Crea script de test `test-webhook.sh`
- ✅ Muestra instrucciones finales

### Fase 3: Configurar Credenciales (10 min)

```bash
# Editar archivo de configuración
nano .env.n8n
# O con tu editor preferido:
# vim .env.n8n
# code .env.n8n
```

**Campos a actualizar**:

```ini
# WhatsApp (requerido)
WHATSAPP_WEBHOOK_URL=https://...
WHATSAPP_API_TOKEN=xxx
WHATSAPP_BUSINESS_ACCOUNT_ID=xxx

# Email (opcional)
IMAP_HOST=mail.sgo.local
EMAIL_USER=transacciones@sgo.local
EMAIL_PASSWORD=xxx

# Slack (opcional)
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

# Google (opcional)
GSHEETS_ID=...
GSHEETS_API_KEY=...

# N8N Security (CAMBIAR)
N8N_USER_MANAGEMENT_JWT_SECRET=super_secret_change_this
N8N_ENCRYPTION_KEY=super_secret_encryption_change_this
```

### Fase 4: Iniciar Contenedor (5 min)

```bash
# Iniciar n8n
docker-compose -f docker-compose.n8n.yml up -d

# Verificar que está corriendo
docker ps | grep n8n

# Ver logs
docker logs sgo_n8n
```

**Esperado**: Mensaje "Server started successfully"

### Fase 5: Verificar Acceso (5 min)

```bash
# Verificar healthcheck
curl http://localhost:5678/healthz

# Abrir en navegador
# http://localhost:5678
```

**Esperado**: Dashboard de n8n cargando sin errores

---

## 📋 Importar Workflow (Dia 1 o 2)

### Paso 1: Acceder a Dashboard

- [ ] Abrir http://localhost:5678
- [ ] Crear admin user (primera vez)
- [ ] Login

### Paso 2: Importar Workflow JSON

- [ ] Click en **Workflows** (izquierda)
- [ ] Click en **+ New** o **Import from JSON**
- [ ] Seleccionar archivo: `n8n-workflow-whatsapp-transacciones.json`
- [ ] Click **Import**

**Esperado**: Workflow aparece en dashboard con todos los nodos

### Paso 3: Revisar Nodos

- [ ] Ver nodo "Webhook WhatsApp"
- [ ] Copiar URL del webhook (para registrar en proveedor)
- [ ] Ver nodo "Crear Transacción API"
- [ ] Verificar URL: `http://api-gateway:8080/api/transacciones`

### Paso 4: Guardar Workflow

- [ ] Click **Save** (arriba derecha)
- [ ] Nombrar: "WhatsApp → Transacciones SGO"

---

## 🔌 Configurar WhatsApp (Dia 1 o 2)

### Opción A: Con Twilio

1. [ ] Crear cuenta en https://www.twilio.com
2. [ ] Obtener Account SID y Auth Token
3. [ ] Crear número de WhatsApp Business
4. [ ] Registrar webhook:
   ```
   https://your-n8n-instance.com/webhook/whatsapp-transacciones
   ```
5. [ ] Enviar mensaje de prueba
6. [ ] Verificar que llega en n8n

### Opción B: Con Wassenger/Baileys

1. [ ] Crear cuenta o ejecutar servidor local
2. [ ] Obtener token de acceso
3. [ ] Configurar en `.env.n8n`
4. [ ] Registrar webhook en sistema
5. [ ] Probar con QR o credenciales

### Opción C: Otra Plataforma

- [ ] Consular `docs-n8n-workflow.md` → Sección 3
- [ ] Registrar webhook en plataforma elegida

---

## 🧪 Testing (Dia 2)

### Test 1: Health Check

```bash
curl http://localhost:5678/healthz
```

**Esperado**: `200 OK`

- [ ] Completado

### Test 2: Postman / Curl

```bash
curl -X POST http://localhost:5678/webhook/whatsapp-transacciones \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "5491123456789",
    "message_data": {
      "obra_id": 1,
      "tipo_transaccion": "pago",
      "associated_id": 5,
      "associated_type": "CLIENTE",
      "monto": 5000.00,
      "concepto": "Test"
    }
  }'
```

**Esperado**:
- Respuesta 200 OK
- Ejecución visible en n8n dashboard
- Transacción creada en BD

- [ ] Completado

### Test 3: Script de Test

```bash
./test-webhook.sh
```

**Esperado**: Ejecución exitosa, respuesta 200

- [ ] Completado

### Test 4: WhatsApp Real

1. [ ] Enviar mensaje desde WhatsApp test
2. [ ] Verificar en n8n dashboard → Execution History
3. [ ] Verificar respuesta en WhatsApp
4. [ ] Verificar transacción en BD:
   ```sql
   SELECT TOP 5 * FROM transacciones ORDER BY id DESC;
   ```

**Esperado**:
- Ejecución en n8n sin errores
- Respuesta en WhatsApp: "✅ Transacción #xxx creada"
- Registro en BD con datos correctos

- [ ] Completado

### Test 5: Error Handling

1. [ ] Intentar con `obra_id` inválida
2. [ ] Intentar con `monto` negativo
3. [ ] Intentar con `associated_id` inexistente

**Esperado**:
- Ejecución falla gracefully
- Respuesta en WhatsApp: "❌ Error: ..."
- Detalles en logs de n8n

- [ ] Completado

---

## 📊 Monitoreo (Dia 3+)

### Dashboard de N8N

- [ ] Abrir http://localhost:5678/admin/execution
- [ ] Ver historial de ejecuciones
- [ ] Filtrar por fecha/estado
- [ ] Buscar errores

### Logs

- [ ] Revisar logs de n8n:
  ```bash
  docker logs sgo_n8n -f
  ```

- [ ] Revisar logs de transacciones:
  ```bash
  docker logs sgo_transacciones-service -f
  ```

- [ ] Revisar logs de API Gateway:
  ```bash
  docker logs api-gateway -f
  ```

### Métricas SQL

```sql
-- Contar transacciones creadas hoy
SELECT COUNT(*) as total
FROM transacciones
WHERE CAST(creadoEn AS DATE) = CAST(GETDATE() AS DATE);

-- Transacciones por tipo
SELECT tipo_transaccion, COUNT(*)
FROM transacciones
GROUP BY tipo_transaccion;
```

- [ ] Verificar métricas regularmente

---

## 🔧 Agregar Disparadores Adicionales (Semana 2+)

### Email

- [ ] Leer: `n8n-disparadores-adicionales.md` → Sección 1
- [ ] Crear nodo Email Trigger
- [ ] Conectar a workflow existente
- [ ] Testear
- [ ] Documentar

Tiempo estimado: **1 hora**

### Slack

- [ ] Leer: `n8n-disparadores-adicionales.md` → Sección 2
- [ ] Crear Slack App
- [ ] Configurar Bot Token
- [ ] Crear nodo Slack Trigger
- [ ] Testear
- [ ] Documentar

Tiempo estimado: **45 minutos**

### Formulario Web

- [ ] Leer: `n8n-disparadores-adicionales.md` → Sección 3
- [ ] Crear formulario HTML/Angular
- [ ] Crear nodo Webhook para formulario
- [ ] Conectar al workflow
- [ ] Testear
- [ ] Documentar

Tiempo estimado: **1.5 horas**

### Google Sheets

- [ ] Leer: `n8n-disparadores-adicionales.md` → Sección 4
- [ ] Crear hoja compartida
- [ ] Configurar Google API
- [ ] Crear nodo GSheets Trigger
- [ ] Testear
- [ ] Documentar

Tiempo estimado: **45 minutos**

---

## 🛡️ Seguridad (Antes de Producción)

### Cambiar Secretos

- [ ] Cambiar `N8N_USER_MANAGEMENT_JWT_SECRET` en `.env.n8n`
- [ ] Cambiar `N8N_ENCRYPTION_KEY` en `.env.n8n`
- [ ] Ejecutar comando para aplicar:
  ```bash
  docker-compose -f docker-compose.n8n.yml down
  docker-compose -f docker-compose.n8n.yml up -d
  ```

### HTTPS en Producción

- [ ] Configurar reverse proxy (nginx/Apache)
- [ ] Obtener certificado SSL (Let's Encrypt)
- [ ] Redirigir http → https
- [ ] Configurar `N8N_WEBHOOK_URL` con https

### Validación de Tokens

- [ ] Crear middleware para validar tokens de WhatsApp
- [ ] Validar firma de Slack
- [ ] Validar tokens de otras integraciones
- [ ] Revisar `docs-n8n-workflow.md` → Sección 9 (Manejo de Errores)

### Backups

- [ ] Configurar backup automático de `/data/n8n.sqlite3`
  ```bash
  # Backup manual
  docker exec sgo_n8n cp /data/n8n.sqlite3 /data/backup/n8n.sqlite3
  ```

- [ ] Backup diario en cron:
  ```bash
  0 2 * * * docker exec sgo_n8n cp /data/n8n.sqlite3 /data/backup/n8n.sqlite3.$(date +\%Y-\%m-\%d)
  ```

- [ ] Prueba de restore de backup
  ```bash
  docker exec sgo_n8n bash -c 'cp /data/backup/n8n.sqlite3 /data/n8n.sqlite3'
  docker restart sgo_n8n
  ```

---

## 📝 Documentación (Dia 1-3)

### Leer (Por Orden)

1. [ ] `N8N-RESUMEN-EJECUTIVO.txt` (5 min)
2. [ ] `README-N8N.md` (15 min)
3. [ ] `docs-n8n-workflow.md` (20 min)
4. [ ] `n8n-workflow-diagram.md` (15 min)
5. [ ] `n8n-disparadores-adicionales.md` (30 min, opcional)

### Documentar Localmente

- [ ] Crear archivo `SETUP-N8N.md` con tu configuración específica
- [ ] Documentar credenciales en sistema seguro (no en Git)
- [ ] Documentar URLs públicas de webhooks
- [ ] Documentar usuarios/contraseñas de n8n
- [ ] Guardar en Obsidian o sistema de notas

---

## 🎯 Validación Final

### Antes de Usar en Producción

- [ ] Todos los tests pasan
- [ ] No hay errores en logs
- [ ] Respuestas en WhatsApp son correctas
- [ ] Transacciones se crean con datos correctos
- [ ] Backup y restore funcionan
- [ ] Documentación actualizada
- [ ] Equipo capacitado
- [ ] Monitoreo configurado
- [ ] Alertas activas

### Go-Live Checklist

- [ ] Notificar a usuarios
- [ ] Cambiar estado del workflow a "Active"
- [ ] Monitorear logs primeras 24 horas
- [ ] Estar disponible para soporte
- [ ] Documentar issues encontrados
- [ ] Preparar rollback si es necesario

---

## 📞 Troubleshooting Rápido

| Problema | Solución | Doc |
|----------|----------|-----|
| Webhook no alcanzable | Ver docker ps, revisar logs | README-N8N.md |
| Connection refused API | Usar hostname correcto (http://api-gateway:8080) | docs-n8n-workflow.md |
| Transaction creation failed | Ver Execution History en n8n | docs-n8n-workflow.md |
| No responde en WhatsApp | Verificar webhookURL en .env.n8n | README-N8N.md |
| SQLite corrupto | Restaurar desde backup | n8n-workflow-diagram.md |

---

## 📅 Timeline Sugerido

**Dia 1**: Setup + Testing básico (45 min)
**Dia 2**: Testing completo + WhatsApp real (1.5 horas)
**Dia 3**: Documentación + Capac equipo (1 hora)
**Semana 2**: Disparadores adicionales (4-6 horas distribuidas)

---

## ✨ Próximos Pasos Después de N8N

1. Agregar disparadores Email/Slack/Formulario
2. Integrar almacenamiento de archivos (MinIO)
3. Crear dashboard de reportes en n8n
4. Automatizar reconciliación de transacciones
5. Agregar notificaciones push/SMS
6. Machine Learning para detección de anomalías

---

## 📌 Notas

- Guardar este checklist para seguimiento
- Marcar tareas completadas
- Documentar cualquier desviación del plan
- Mantener logs de ejecución para auditoría
- Revisar regularmente (semanal) Execution History

---

**Última actualización**: 2026-04-29
**Versión**: 1.0
**Estado**: Ready to implement
