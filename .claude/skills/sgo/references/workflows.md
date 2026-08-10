# Flujo de trabajo en SGO

## Antes de escribir código

1. Identificá el módulo en `modulos.md` y abrí el archivo vecino más cercano.
2. Si el cambio toca dinero, estados o saldos → leé `dominio-negocio.md` **completo** de esa
   sección antes de tocar nada. La mayoría de los bugs históricos vinieron de recalcular algo
   que ya estaba resuelto en otro lado.
3. Verificá si el cálculo debe ir en backend (casi siempre sí).
4. Si toca el esquema → mirá el estado de migraciones del servicio.

## Ramas y commits

Ramas: `main` ← `develop` ← `feature/*` | `fix/*` | `fixes/*`.

Formato de commit (conventional commits, **en español, sin tildes en el subject**):

```
feat(auth-service): asignar plan ENTERPRISE (ilimitado) a organizacion de Pablo
fix(transacciones-service): migracion V34 idempotente para creado_en
fix(api-gateway): webhook de MP se armaba con URL rota, nunca llegaba a auth-service
test: cubrir PlanLimitChecker y ExchangeRateService con unit tests
chore: bump version v1.17.50 y agregar pendientes al changelog
merge: integrar planes de suscripcion y checkout MercadoPago a develop
```

Scope = servicio o componente afectado. El subject describe el **efecto real**, no el archivo
tocado. Nunca commitees ni pushees sin que te lo pidan.

## Validación pre-commit

```bash
node .claude/validators/pre-commit-validator.js
```

Valida los archivos staged: Angular (`standalone`, `@if`/`@for`, naming), Java (DTOs separados,
entidades sin `@Data`, migraciones con sintaxis SQL Server). Errores = bloqueantes,
warnings = recomendaciones. También disponible como `/validate-code` y vía el agente
`pre-commit-validator`.

## Migraciones Flyway — cuidados

Este repo ya sufrió **tres** incidentes de migración. Antes de crear una:

1. `ls backend1.0/<servicio>/src/main/resources/db/migration | sort -V | tail -3`
   → el número siguiente es el libre. Ver tabla en `backend.md`.
2. Chequeá si hay ramas paralelas con migraciones del mismo servicio (`git branch -a`).
   La base de dev es compartida: una migración con número repetido rompe el arranque.
3. **Hacela idempotente** (`IF NOT EXISTS`, `CREATE OR ALTER`, `IF OBJECT_ID(...) IS NULL`).
   En la base de dev ya pueden existir objetos de otra rama.
4. Si tocás un stored procedure, **copiá la última versión vigente completa** (puede estar en
   una migración anterior a la última del servicio) y modificá sobre esa: se recrean enteros.
5. La migración corre al arrancar el servicio dueño → reiniciá ese servicio.

## Qué reiniciar

| Cambio | Reiniciar |
|---|---|
| Solo Angular | recargar navegador / rebuild frontend |
| Un microservicio | ese servicio |
| Contrato consumido por el front | el servicio + `api-gateway` + recargar frontend |
| Facturación | `transacciones-service` + `obras-service` + `api-gateway` |
| Reportes / cuentas corrientes | `reportes-service` + `api-gateway` |
| Documentos o notas | `documentos-service` + `api-gateway` |
| Planes, login, suscripciones | `auth-service` + `api-gateway` |
| Migración Flyway | el servicio dueño |

**Siempre cerrá el cambio informando explícitamente qué reiniciar.** Es una regla del proyecto.

## Comandos habituales

```bash
mvn -pl obras-service clean compile -q
```

```bash
mvn -pl reportes-service test -q
```

```bash
npm run start
```

```bash
docker compose up -d
```

Maven se corre desde `backend1.0/` con `-pl <servicio>`.

## Bitácora y seguimiento

- **`AGENTS.md`** — bitácora viva. Al cerrar un cambio funcional agregá una entrada:
  ```
  ### YYYY-MM-DD
  - Cambio:
  - Impacto funcional:
  - Servicios a reiniciar:
  - Observaciones:
  ```
  ⚠️ Sus secciones de arquitectura están desactualizadas (dice `frontend1.2` y SQLite).
  La bitácora sirve; el encabezado no.
- **Google Sheets `FIXES`** — id `1JvFOLkCvdA39OH9HdCFps1-jlrX19GEXgD7TTD9ifRw`, pestaña `FIXES`.
  Columnas: ID, MÓDULO, DESCRIPCIÓN, PASOS A REPRODUCIR, ESTADO (PENDIENTE / EN_PROGRESO /
  RESUELTO / DESCARTADO), OBSERVACIONES INTERNAS, FECHA IDENTIFICADO, FECHA RESUELTO, PRIORIDAD.
- **Obsidian** — `Sistema de Gestión de Obras\Tareas Resueltas\{ID} - {Título}.md`.
- **Changelog in-app** — `services/changelog/` + `shared/changelog-modal/`; se versiona
  (`v1.17.50`) con commits `chore: bump version`.

## Agentes y skills del repo

- `.claude/agents/` — `obra-expert`, `fix-analyzer`, `best-practices`, `validator`,
  `pre-commit-validator`.
- `.claude/skills/` — esta skill (`sgo`), `angular-developer`, `springboot-patterns`,
  `frontend-design`, `ui-ux-pro-max`, `design-taste-frontend`, `github-actions-docs`,
  `find-skills`.
- Para código Angular idiomático: `angular-developer` (tiene `references/` de signals, forms,
  routing, testing). Para patrones Spring: `springboot-patterns`.
  **Ambas dan el "cómo" genérico; esta skill da el "qué" y el "dónde" de SGO. Ante conflicto,
  gana SGO** — las convenciones del repo están por encima de la buena práctica general.

## Errores conocidos que no hay que repetir

- Recalcular saldos o cuentas corrientes en el frontend.
- Generar o mostrar `FACTURADA_TOTAL`.
- Incluir `COTIZADA` en cuentas corrientes o filtros en cascada.
- Reactivar "Impacta cta. cte." en facturas (está deshabilitado a pedido).
- Crear una migración con un número ya usado en otra rama.
- Editar en `frontend1.2/` en vez de `frontend/`.
- Escribir el presupuesto de la obra a mano en vez de derivarlo de los costos.
- Olvidar el filtro por `organizacion_id` en un listado nuevo.
- Mostrar un listado sin esperar los datos secundarios que la tabla necesita (parpadeo).
