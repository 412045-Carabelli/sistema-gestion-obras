# N8N: Workflow de Transacciones desde WhatsApp y Más

**Proyecto**: Sistema de Gestión de Obras (SGO)
**Propósito**: Crear transacciones (pagos/cobros) desde múltiples canales (WhatsApp, Email, Slack, etc.) directamente al sistema
**Versión**: 1.0
**Fecha**: 2026-04-29

---

## 📁 Archivos Incluidos

### 1. **n8n-workflow-whatsapp-transacciones.json**
- **Qué es**: Workflow completo listo para importar en n8n
- **Qué hace**: Recibe un mensaje de WhatsApp con datos de transacción y la crea en la BD mediante la API
- **Cómo usarlo**:
  1. Abre n8n en `http://localhost:5678`
  2. Workflows → Import from JSON
  3. Copia el contenido del archivo
  4. Click Import

### 2. **docs-n8n-workflow.md**
- **Qué es**: Documentación completa del workflow principal
- **Contiene**:
  - Flujo general paso a paso
  - Estructura esperada del payload desde WhatsApp
  - Configuración inicial en n8n
  - Descripción de cada nodo del workflow
  - Manejo de errores
  - Variables globales
  - Checklist de implementación
  - Logs y debugging
- **Lee esto si**: Quieres entender cómo funciona el workflow completo

### 3. **n8n-disparadores-adicionales.md**
- **Qué es**: Guía para agregar más canales de entrada (Email, Slack, Formulario Web, Google Sheets, Telegram, CSV)
- **Contiene**:
  - Patrón general para todos los disparadores
  - Código JSON específico para cada integración
  - Ejemplos de uso
  - Configuración por proveedor
  - Cómo convergir múltiples disparadores en un único punto de API
- **Lee esto si**: Quieres extender el sistema con Email, Slack, formularios web, etc.

### 4. **n8n-workflow-diagram.md**
- **Qué es**: Visualización arquitectónica del flujo completo
- **Contiene**:
  - Diagrama Mermaid del flujo WhatsApp
  - Diagrama Mermaid multi-disparador
  - Diagrama de integración con servicios SGO
  - Secuencia temporal (sequence diagram)
  - Variables de entorno requeridas
  - Script SQL para auditoría de transacciones
  - Tabla de API calls
  - Tablas de error handling
  - Monitoreo y observabilidad
- **Lee esto si**: Prefieres visualizar arquitectura antes de implementar

### 5. **n8n-setup.sh**
- **Qué es**: Script bash automatizado para setup inicial de n8n
- **Qué hace**:
  1. Valida requisitos (Docker, Docker Compose)
  2. Crea archivo `.env.n8n` con variables de entorno
  3. Genera `docker-compose.n8n.yml`
  4. Crea script de test `test-webhook.sh`
  5. Muestra instrucciones finales
- **Cómo usarlo**:
  ```bash
  chmod +x n8n-setup.sh
  ./n8n-setup.sh
  ```

### 6. **README-N8N.md** (Este archivo)
- Índice y guía de inicio rápido

---

## 🚀 Inicio Rápido

### Opción A: Setup Automatizado (Recomendado)

```bash
# 1. Ejecutar script de setup
chmod +x n8n-setup.sh
./n8n-setup.sh

# 2. Editar credenciales
nano .env.n8n

# 3. Iniciar n8n
docker-compose -f docker-compose.n8n.yml up -d

# 4. Esperar a que esté listo
sleep 30

# 5. Abrir en navegador
open http://localhost:5678
```

### Opción B: Setup Manual

```bash
# 1. Crear archivo .env.n8n (ver template en n8n-setup.sh)
cp .env.n8n.template .env.n8n
nano .env.n8n

# 2. Iniciar contenedor
docker-compose -f docker-compose.n8n.yml up -d

# 3. Abrir interfaz
# http://localhost:5678
```

---

## 📝 Flujo de Implementación

### Fase 1: Setup Básico (30 min)
- [ ] Ejecutar `n8n-setup.sh`
- [ ] Actualizar credenciales en `.env.n8n`
- [ ] Iniciar contenedor de n8n
- [ ] Verificar healthcheck

### Fase 2: Importar Workflow (10 min)
- [ ] Abrir n8n dashboard
- [ ] Importar `n8n-workflow-whatsapp-transacciones.json`
- [ ] Revisar nodos del workflow
- [ ] Actualizar URLs de API si es necesario

### Fase 3: Configurar WhatsApp (20 min)
- [ ] Registrarse en proveedor (Twilio, Wassenger, etc.)
- [ ] Obtener URL del webhook de n8n
- [ ] Registrar webhook en proveedor
- [ ] Testear con `./test-webhook.sh`

### Fase 4: Validar Integración (20 min)
- [ ] Verificar que la API de transacciones responde
- [ ] Testear creación de transacción desde Postman
- [ ] Enviar mensaje de prueba desde WhatsApp
- [ ] Verificar que llega la respuesta
- [ ] Revisar logs en n8n y servicio de transacciones

### Fase 5: Agregar Disparadores Adicionales (Variable)
- [ ] Email (1 hora)
- [ ] Slack (45 min)
- [ ] Formulario Web (1.5 horas)
- [ ] Google Sheets (45 min)

---

## 🔌 Estructura de Payload Esperado

### Desde WhatsApp

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
    "concepto": "Pago hormigonado"
  }
}
```

### Campos Mínimos Requeridos

| Campo | Tipo | Ejemplo | Nota |
|-------|------|---------|------|
| `obra_id` | Int | 1 | Debe existir en BD |
| `tipo_transaccion` | String | "PAGO" | PAGO o COBRO |
| `associated_id` | Int | 5 | Cliente o Proveedor |
| `associated_type` | String | "CLIENTE" | CLIENTE o PROVEEDOR |
| `monto` | Float | 5000.00 | Mayor a 0 |

---

## 🧪 Testing

### Test 1: Webhook desde Postman

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
      "concepto": "Test"
    }
  }'
```

### Test 2: Usar script incluido

```bash
./test-webhook.sh http://localhost:5678/webhook/whatsapp-transacciones
```

### Test 3: Ver ejecuciones en n8n

1. Abre n8n dashboard
2. Workflows → tu workflow
3. View → Execution History
4. Haz clic en ejecución para ver detalles

---

## 📊 Integración con Servicios SGO

El workflow interactúa con estos servicios:

| Servicio | Puerto | Endpoint | Método |
|----------|--------|----------|--------|
| API Gateway | 8080 | `/api/transacciones` | POST |
| Transacciones | 8086 | `/api/transacciones` | POST |
| Obras | 8081 | `/api/obras/{id}` | GET |
| Clientes | 8082 | `/api/clientes/{id}` | GET |
| Proveedores | 8083 | `/api/proveedores/{id}` | GET |

**Nota**: Todos se acceden a través del `api-gateway` en `http://api-gateway:8080`

---

## 🔧 Configuración de Disparadores Adicionales

### Email

Documentación: `n8n-disparadores-adicionales.md` → Sección 1

Tiempo estimado: 1 hora
Complejidad: Media

### Slack

Documentación: `n8n-disparadores-adicionales.md` → Sección 2

Tiempo estimado: 45 minutos
Complejidad: Media

### Formulario Web

Documentación: `n8n-disparadores-adicionales.md` → Sección 3

Tiempo estimado: 1.5 horas
Complejidad: Media

### Google Sheets

Documentación: `n8n-disparadores-adicionales.md` → Sección 4

Tiempo estimado: 45 minutos
Complejidad: Baja

### Telegram

Documentación: `n8n-disparadores-adicionales.md` → Sección 5

Tiempo estimado: 30 minutos
Complejidad: Baja

---

## 📈 Monitoreo y Logs

### Ver logs de n8n

```bash
docker logs sgo_n8n -f
```

### Ver logs de transacciones-service

```bash
docker logs sgo_transacciones-service -f
```

### Dashboard de n8n

Abre: http://localhost:5678/admin/execution

Aquí verás:
- Ejecuciones totales
- Tasa de éxito/error
- Tiempo promedio
- Detalles de cada ejecución

---

## 🛡️ Seguridad

### Checklist de Seguridad

- [ ] Cambiar `N8N_USER_MANAGEMENT_JWT_SECRET` en `.env.n8n`
- [ ] Cambiar `N8N_ENCRYPTION_KEY` en `.env.n8n`
- [ ] Usar HTTPS en producción (proxy con Let's Encrypt)
- [ ] Restringir acceso a n8n dashboard con autenticación
- [ ] Validar tokens de WhatsApp/Slack en cada request
- [ ] Cifrar credenciales en n8n (usar credenciales del tipo "Credentials")
- [ ] Auditar logs regularmente
- [ ] Hacer backup de datos en `/data/n8n.sqlite3`

---

## 🔄 Workflow Diagram (Quick Reference)

```
Disparador (WhatsApp)
    ↓
Extraer datos
    ↓
Normalizar variables
    ↓
POST /api/transacciones
    ↓
¿Éxito?
├─ Sí → Responder al usuario ✅
└─ No → Enviar error ❌
```

---

## 📚 Documentación Relacionada

| Documento | Propósito | Tiempo Lectura |
|-----------|-----------|----------------|
| `docs-n8n-workflow.md` | Referencia completa del workflow | 20 min |
| `n8n-disparadores-adicionales.md` | Guía de extensiones | 30 min |
| `n8n-workflow-diagram.md` | Visualización arquitectónica | 15 min |
| CLAUDE.md | Convenciones del proyecto | 30 min |

---

## 🚨 Troubleshooting

### Problema: "Webhook not reachable"

**Solución**:
```bash
# 1. Verificar que n8n está corriendo
docker ps | grep n8n

# 2. Verificar healthcheck
curl http://localhost:5678/healthz

# 3. Revisar logs
docker logs sgo_n8n
```

### Problema: "API Gateway connection refused"

**Solución**:
```bash
# 1. Verificar que API Gateway está en la misma red
docker network ls

# 2. Verificar conectividad desde n8n
docker exec sgo_n8n curl http://api-gateway:8080/healthz

# 3. Usar hostname en lugar de localhost
# ✅ http://api-gateway:8080
# ❌ http://localhost:8080
```

### Problema: "Transaction creation failed"

**Solución**:
1. Ver payload en logs de n8n
2. Testear endpoint directamente:
   ```bash
   curl -X POST http://api-gateway:8080/api/transacciones \
     -H "Content-Type: application/json" \
     -d '{ ... }'
   ```
3. Revisar logs de transacciones-service:
   ```bash
   docker logs sgo_transacciones-service
   ```

---

## 📞 Soporte

### Canales de Ayuda

1. **Documentación**: Lee primero `docs-n8n-workflow.md`
2. **Oficial n8n**: https://docs.n8n.io
3. **Community**: https://community.n8n.io
4. **Proyecto**: Ver `CLAUDE.md` y `AGENTS.md`

---

## ✅ Checklist Final

Antes de pasar a producción:

- [ ] Setup completado sin errores
- [ ] Workflow importado y visible en dashboard
- [ ] Credenciales configuradas para cada integración
- [ ] Testeo exitoso con Postman
- [ ] Testeo exitoso desde WhatsApp
- [ ] Mensajes de respuesta llegan correctamente
- [ ] Transacciones se crean en BD
- [ ] Logs se generan sin errores
- [ ] Backup de datos configurado
- [ ] Documentación actualizada para el equipo

---

## 🎯 Próximos Pasos

1. **Corto plazo**: Implementar disparadores Email, Slack, Formulario Web
2. **Mediano plazo**: Agregar validaciones avanzadas (monto máximo, auditoría)
3. **Largo plazo**: Machine Learning para detección de anomalías

---

**Versión**: 1.0
**Última actualización**: 2026-04-29
**Mantenedor**: SGO Team
**Estado**: Listo para producción
