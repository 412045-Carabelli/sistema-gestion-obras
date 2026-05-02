# 🤖 Bot WhatsApp - N8N Workflow para SGO

**Carpeta**: `bot-whatsapp/`
**Propósito**: Crear transacciones desde WhatsApp y otros canales
**Versión**: 1.0
**Estado**: Listo para producción

---

## 📁 Estructura de la Carpeta

```
bot-whatsapp/
├── INDEX.md                                    # Este archivo
├── N8N-RESUMEN-EJECUTIVO.txt                  # Resumen 30 segundos (EMPEZAR AQUÍ)
├── N8N-CHECKLIST.md                           # Checklist de implementación
├── README-N8N.md                              # Guía completa de inicio
├── docs-n8n-workflow.md                       # Manual detallado del workflow
├── n8n-workflow-diagram.md                    # Diagramas Mermaid y arquitectura
├── n8n-disparadores-adicionales.md            # Cómo agregar Email, Slack, etc.
├── n8n-workflow-whatsapp-transacciones.json   # Workflow JSON (importar en n8n)
├── docker-compose.n8n.yml                     # Docker Compose para n8n
└── n8n-setup.sh                               # Script de setup automático
```

---

## 🚀 Inicio Rápido (20 minutos)

### Paso 1: Leer Resumen (2 min)
```bash
cat N8N-RESUMEN-EJECUTIVO.txt
```

### Paso 2: Setup Automático (2 min)
```bash
chmod +x n8n-setup.sh
./n8n-setup.sh
```

### Paso 3: Configurar Credenciales (5 min)
```bash
nano .env.n8n
# Actualizar WHATSAPP_WEBHOOK_URL, WHATSAPP_API_TOKEN, etc.
```

### Paso 4: Iniciar N8N (1 min)
```bash
docker-compose -f docker-compose.n8n.yml up -d
```

### Paso 5: Importar Workflow (5 min)
- Abrir http://localhost:5678
- Workflows → Import from JSON
- Seleccionar `n8n-workflow-whatsapp-transacciones.json`
- Click Import

### Paso 6: Testear (5 min)
```bash
./test-webhook.sh
# O con curl
curl -X POST http://localhost:5678/webhook/whatsapp-transacciones \
  -H "Content-Type: application/json" \
  -d '{ "phone_number": "5491123456789", ... }'
```

---

## 📖 Documentación por Rol

### 👨‍💼 Project Manager / Líder Técnico
1. Leer: `N8N-RESUMEN-EJECUTIVO.txt` (5 min)
2. Usar: `N8N-CHECKLIST.md` para seguimiento
3. Referencia: `README-N8N.md` → Troubleshooting

### 👨‍💻 Implementador / DevOps
1. Leer: `N8N-RESUMEN-EJECUTIVO.txt` (5 min)
2. Leer: `README-N8N.md` (15 min)
3. Ejecutar: `n8n-setup.sh`
4. Referencia: `docs-n8n-workflow.md`
5. Debug: `n8n-workflow-diagram.md`

### 🏗️ Arquitecto
1. Leer: `n8n-workflow-diagram.md` (15 min)
2. Leer: `docs-n8n-workflow.md` → Sección "Integration" (10 min)
3. Referencia: `n8n-disparadores-adicionales.md`

### 🔧 Soporte / Mantenimiento
1. Leer: `README-N8N.md` → Troubleshooting (10 min)
2. Referencia: `N8N-CHECKLIST.md`
3. Monitoreo: Ver logs en `docker logs sgo_n8n -f`

---

## 📄 Descripción Detallada de Archivos

### **N8N-RESUMEN-EJECUTIVO.txt**
- **Lectura**: 5 minutos
- **Contenido**: Overview, flujo, requisitos, testing rápido
- **Para quién**: TODOS (empezar aquí)

### **README-N8N.md**
- **Lectura**: 20 minutos
- **Contenido**: Inicio rápido, estructura, guía paso a paso, troubleshooting
- **Para quién**: Implementadores, DevOps

### **docs-n8n-workflow.md**
- **Lectura**: 30 minutos
- **Contenido**: Flujo detallado, payloads, nodos, manejo de errores, variables, logging
- **Para quién**: Implementadores, QA, arquitectos

### **n8n-workflow-diagram.md**
- **Lectura**: 20 minutos
- **Contenido**: Diagramas Mermaid, arquitectura, BD, secuencias, monitoreo
- **Para quién**: Arquitectos, líder técnico

### **n8n-disparadores-adicionales.md**
- **Lectura**: 40 minutos
- **Contenido**: Email, Slack, Formulario Web, Google Sheets, Telegram, CSV
- **Para quién**: Implementadores (futuras extensiones)

### **N8N-CHECKLIST.md**
- **Lectura**: Referencia durante implementación
- **Contenido**: Checklist completo desde requisitos hasta go-live
- **Para quién**: Project Manager, implementadores

### **n8n-workflow-whatsapp-transacciones.json**
- **Tipo**: Archivo de configuración
- **Contenido**: Workflow completo listo para importar
- **Acción**: Importar en n8n dashboard

### **docker-compose.n8n.yml**
- **Tipo**: Configuración Docker
- **Contenido**: Servicio n8n + variables de entorno
- **Acción**: Usar con `docker-compose -f docker-compose.n8n.yml up -d`

### **n8n-setup.sh**
- **Tipo**: Script bash
- **Contenido**: Automatiza setup inicial (validaciones, .env, docker-compose)
- **Acción**: Ejecutar con `./n8n-setup.sh`

### **INDEX.md**
- **Este archivo**: Guía de la carpeta

---

## 🎯 Flujo de Implementación Recomendado

```
Día 1 (2 horas):
├─ Leer N8N-RESUMEN-EJECUTIVO.txt (5 min)
├─ Ejecutar n8n-setup.sh (5 min)
├─ Editar .env.n8n (10 min)
├─ Iniciar docker-compose (5 min)
└─ Testing básico (30 min)

Día 2 (3 horas):
├─ Leer README-N8N.md (15 min)
├─ Importar workflow JSON (5 min)
├─ Configurar WhatsApp (30 min)
├─ Testing con Postman (20 min)
└─ Testing con WhatsApp real (60 min)

Día 3 (2 horas):
├─ Leer docs-n8n-workflow.md (30 min)
├─ Validar seguridad (30 min)
├─ Documentar para equipo (30 min)
└─ Capacitación (30 min)

Semana 2+ (4-6 horas):
└─ Agregar disparadores adicionales (Email, Slack, etc.)
```

---

## 🔧 Comandos Útiles

### Setup
```bash
chmod +x n8n-setup.sh
./n8n-setup.sh
```

### Iniciar/Detener
```bash
# Iniciar
docker-compose -f docker-compose.n8n.yml up -d

# Ver logs
docker logs sgo_n8n -f

# Detener
docker-compose -f docker-compose.n8n.yml down
```

### Testing
```bash
# Script de test
./test-webhook.sh

# Curl manual
curl -X POST http://localhost:5678/webhook/whatsapp-transacciones \
  -H "Content-Type: application/json" \
  -d '{ ... }'

# Health check
curl http://localhost:5678/healthz
```

### Dashboard
```bash
# Abrir en navegador
http://localhost:5678

# Execution History
http://localhost:5678/admin/execution
```

---

## 📊 Nodos del Workflow

El workflow incluye estos nodos principales:

1. **Webhook WhatsApp** - Entrada desde WhatsApp
2. **Input Obra** - Extrae ID de obra
3. **Input Monto** - Extrae monto
4. **Input Forma Pago** - Extrae forma de pago
5. **Input Concepto** - Extrae concepto/descripción
6. **Select Tipo** - Convierte pago/cobro a PAGO/COBRO
7. **Select Cliente/Proveedor** - Extrae asociado
8. **Crear Transacción API** - POST a /api/transacciones
9. **Check Success** - Valida respuesta
10. **Enviar Respuesta WhatsApp** - Confirma al usuario
11. **Enviar Error WhatsApp** - Notifica error

---

## 🔌 Integración con SGO

El workflow se conecta con estos servicios:

| Servicio | Puerto | Endpoint | Uso |
|----------|--------|----------|-----|
| API Gateway | 8080 | `/api/transacciones` | POST transacción |
| Transacciones | 8086 | `/api/transacciones` | Procesa |
| Obras | 8081 | `/api/obras/{id}` | Valida obra |
| Clientes | 8082 | `/api/clientes/{id}` | Valida cliente |
| Proveedores | 8083 | `/api/proveedores/{id}` | Valida proveedor |

---

## 🛡️ Seguridad

Antes de producción:

- [ ] Cambiar `N8N_USER_MANAGEMENT_JWT_SECRET`
- [ ] Cambiar `N8N_ENCRYPTION_KEY`
- [ ] Configurar HTTPS (reverse proxy)
- [ ] Validar tokens de proveedores
- [ ] Configurar backups
- [ ] Revisar logs regularmente

---

## 📈 Monitoreo

### Dashboard
- http://localhost:5678/admin/execution
- Ver ejecuciones, errores, tiempo promedio

### Logs
```bash
docker logs sgo_n8n -f
docker logs sgo_transacciones-service -f
```

### Métricas SQL
```sql
SELECT COUNT(*) FROM transacciones WHERE CAST(creadoEn AS DATE) = CAST(GETDATE() AS DATE);
```

---

## ❌ Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| Webhook no responde | `docker ps` + revisar logs |
| Connection refused API | Usar `http://api-gateway:8080` (no localhost) |
| Transaction creation failed | Ver Execution History en n8n |
| No llega respuesta WhatsApp | Verificar WHATSAPP_WEBHOOK_URL en .env.n8n |

---

## 🚀 Próximas Extensiones

1. **Email** (1 hora) - Ver `n8n-disparadores-adicionales.md` Sección 1
2. **Slack** (45 min) - Ver `n8n-disparadores-adicionales.md` Sección 2
3. **Formulario Web** (1.5 h) - Ver `n8n-disparadores-adicionales.md` Sección 3
4. **Google Sheets** (45 min) - Ver `n8n-disparadores-adicionales.md` Sección 4

---

## 📞 Soporte

### Documentación
- Oficial n8n: https://docs.n8n.io
- Community: https://community.n8n.io

### En este proyecto
- Ver README-N8N.md → Troubleshooting
- Ver N8N-CHECKLIST.md → Validación Final

---

## ✅ Checklist de Verificación

Antes de usar en producción:

- [ ] Todos los archivos están en la carpeta `bot-whatsapp/`
- [ ] Se ejecutó `n8n-setup.sh` sin errores
- [ ] Archivo `.env.n8n` configurado con credenciales
- [ ] Docker Compose inició correctamente
- [ ] Workflow importado en n8n
- [ ] Testing con Postman pasó
- [ ] Testing con WhatsApp real pasó
- [ ] Respuestas llegan correctamente
- [ ] Transacciones se crean en BD
- [ ] No hay errores en logs
- [ ] Documentación revisada
- [ ] Equipo capacitado

---

**Última actualización**: 2026-04-29
**Versión**: 1.0
**Mantenedor**: SGO Team
**Estado**: Listo para producción
