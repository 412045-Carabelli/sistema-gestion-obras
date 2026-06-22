# Setup Notion CRM para SGO Startup

## Paso 1: Crear Databases en Notion

### DB 1: Prospects (Leads y Clientes)
1. En tu workspace Notion, crea una nueva database
2. Nombre: **Prospects**
3. Propiedades:
   - **Nombre** (Text, required)
   - **Industria** (Select: Construcción, Arquitectura, Inmobiliario, Desarrollo, Otros)
   - **Región** (Select: CABA, BA Exterior, Interior, LATAM)
   - **Email** (Email)
   - **Teléfono** (Phone)
   - **Empresa** (Text)
   - **Fuente** (Select: Google Maps, LinkedIn, Referencia, Inbound, Evento)
   - **Estado** (Select: Nuevo, Contactado, Interesado, Reunión, Propuesta, Ganado, Perdido)
   - **Próxima Acción** (Text)
   - **Fecha Próximo Contacto** (Date)
   - **Notas** (Long text)

### DB 2: Deals (Pipeline de Ventas)
1. Nombre: **Deals**
2. Propiedades:
   - **Título Deal** (Text, required)
   - **Cliente** (Relation → Prospects)
   - **Valor USD** (Number)
   - **Probabilidad** (Select: 10%, 25%, 50%, 75%, 90%)
   - **Stage** (Select: Discovery, Propuesta, Negociación, Cierre, Ganado, Perdido)
   - **Fecha Cierre Estimada** (Date)
   - **Descripción** (Long text)
   - **Notas Internas** (Long text)

### DB 3: Support Tickets
1. Nombre: **Support Tickets**
2. Propiedades:
   - **Ticket ID** (Text, required)
   - **Cliente** (Relation → Prospects)
   - **Asunto** (Text)
   - **Descripción** (Long text)
   - **Prioridad** (Select: Baja, Media, Alta, Crítica)
   - **Estado** (Select: Abierto, En Progreso, En Espera, Resuelto, Cerrado)
   - **Fecha Resolución** (Date)

### DB 4: Ideas (Innovation Backlog)
1. Nombre: **Ideas**
2. Propiedades:
   - **Título** (Text, required)
   - **Descripción** (Long text)
   - **Categoría** (Select: Feature, Product, Mejora, Investigación)
   - **Status** (Select: Idea, Análisis, En desarrollo, Implementada)
   - **Impacto** (Select: Bajo, Medio, Alto)
   - **Esfuerzo** (Select: Bajo, Medio, Alto)
   - **Factibilidad** (Select: No viable, Compleja, Viable, Fácil)
   - **Análisis** (Long text)

---

## Paso 2: Obtener Database IDs

Para cada database creada:
1. Abre la database en Notion
2. Copia la URL
3. El ID está entre `/p/` y `?v=`
   - Ejemplo: `https://app.notion.com/p/38759b0654ef8039b1e7f72c0d382689?v=...`
   - ID = `38759b0654ef8039b1e7f72c0d382689`

---

## Paso 3: Actualizar .env.notion

Una vez tengas los IDs, edita `.env.notion`:

```env
NOTION_DB_PROSPECTS={prospects_database_id}
NOTION_DB_DEALS={deals_database_id}
NOTION_DB_SUPPORT_TICKETS={support_tickets_database_id}
NOTION_DB_IDEAS={ideas_database_id}
```

---

## Paso 4: Verificar Agents

```bash
# Ver agents creados
ls -la C:\Users\Usuario\.claude\agents\

# Deben estar:
# - sgo-comercial.yaml
# - sgo-innovation.yaml
```

---

## Paso 5: Rutinas Automáticas (Próximas)

Una vez validado, configurar rutinas con `/schedule`:

**sgo-comercial**:
- Daily 10 AM: follow-ups automáticos
- Daily 5 PM: resumen pipeline
- Viernes 6 PM: reporte semanal

**sgo-innovation**:
- Jueves 11 AM: trend scanning
- Quincenalmente: análisis de ideas

---

## Credenciales Guardadas

- API Key Notion: `C:\Users\Usuario\Desktop\my-work\sistema-gestion-obras\.env.notion`
- Agents: `C:\Users\Usuario\.claude\agents\`
- Memory: `C:\Users\Usuario\.claude\projects\C--Users-Usuario-Desktop-my-work-sistema-gestion-obras\memory\startup_notion_crm.md`

---

## Próximos Pasos

1. ✅ Crear 4 databases en Notion (manual)
2. ✅ Completar `.env.notion` con IDs
3. ⏳ Activar agents: `/sgo-comercial prospect CABA Construcción`
4. ⏳ Configurar rutinas automáticas vía `/schedule`
5. ⏳ Integrar MCPs: Notion API, Google Search
