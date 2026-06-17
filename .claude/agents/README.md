# Agents del Proyecto SGO

Tres agentes personalizados para asistir en desarrollo del Sistema de Gestión de Obras.

## Agents Disponibles

### 1. **obra-expert** 🏗️
**Expertise**: Gestión constructora, lógica de negocio, impacto financiero

**Úsalo cuando**:
- Necesites validar que cambios reflejan realidades constructivas
- Analices impacto financiero de decisiones técnicas
- Diseñes flujos de trabajo para constructoras
- Entiendas qué reportes son críticos

**Ejemplo**:
```
Como obra-expert, ¿qué validaciones de negocio necesita este campo "margen_ganancia"?
```

---

### 2. **fix-analyzer** 🔍
**Expertise**: Desambiguación, análisis de problemas, soluciones mínimas

**Úsalo cuando**:
- El cliente reporta algo sin claridad técnica
- Necesites traducir requisitos vagos a código
- Localices dónde está el problema exacto
- Definas validaciones para confirmar corrección

**Ejemplo**:
```
Como fix-analyzer, el cliente dice "no aparecen los gastos reales en la obra".
¿Qué tengo que cambiar?
```

---

### 3. **best-practices** ✨
**Expertise**: Patrones SOLID, optimizaciones, frameworks modernos

**Úsalo cuando**:
- Implementes nueva feature
- Refactorices código existente
- Necesites guidance en Angular 19 o Spring 3.3.5
- Apliques patrones de diseño

**Ejemplo**:
```
Como best-practices, refactoriza este servicio para que sea mantenible y siga SOLID.
```

---

## Cómo Usarlos

### Opción A: Mención Directa en Prompts
```
@obra-expert ¿cuál es el impacto de agregar este campo?

@fix-analyzer El usuario dice que falta un botón en la pantalla de obras

@best-practices ¿cómo debo estructurar este módulo?
```

### Opción B: Como Contexto de Respuesta
```
Considerando @obra-expert (lógica constructiva) y @best-practices
(patrones limpios), ¿cómo diseño el módulo de reportería?
```

### Opción C: Combinados para Análisis Completo
```
@fix-analyzer: Desambigua este requerimiento

Luego @obra-expert: Valida contra lógica constructiva

Finalmente @best-practices: Propón la solución con patrones limpios
```

---

## Contenido de Cada Agent

### obra-expert.md
- ✅ Procesos constructivos (etapas, costos, presupuestos)
- ✅ Métricas clave (avance, márgenes, cumplimiento)
- ✅ Entidades del sistema SGO
- ✅ Ciclo de vida financiero
- ✅ Preguntas guía

### fix-analyzer.md
- ✅ Proceso de desambiguación (4 fases)
- ✅ Mapeo a estructura SGO (frontend, backend, BD)
- ✅ Plantilla de análisis
- ✅ Ejemplos comunes de traducción
- ✅ Red flags

### best-practices.md
- ✅ Patrones por stack (Angular, Spring, SQL Server)
- ✅ Principios SOLID detallados
- ✅ Checklist de calidad de código
- ✅ Frameworks actualizados (versiones exactas)
- ✅ Optimizaciones específicas SGO

---

## Tips de Uso

💡 **Combina agents para máximo impacto**:
```
Primero, como @fix-analyzer, desambigua este requerimiento confuso.
Luego, como @obra-expert, valida si tiene sentido en construcción.
Finalmente, como @best-practices, propón la solución arquitectónica.
```

💡 **Mantén el contexto SGO**:
Los agents conocen la estructura específica del proyecto:
- Frontend: `frontend/src/app/`
- Backend: `backend1.0/{servicio}/`
- DB: `db/migration/`

💡 **Usa en momentos clave**:
- Desambiguación de requisitos → **fix-analyzer**
- Validación de lógica negocio → **obra-expert**
- Revisión de código → **best-practices**

---

## Integración con CLAUDE.md

Estos agents **complementan** el CLAUDE.md del proyecto. Juntos:
- **CLAUDE.md**: Convenciones exactas del código
- **Agents**: Contexto y expertise para decisiones

Léelos ambos para máximo impacto.

---

*Agents creados 2026-04-28 para SGO*
*Ubicación: `.claude/agents/`*
