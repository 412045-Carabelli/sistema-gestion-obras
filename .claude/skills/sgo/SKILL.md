---
name: sgo
description: Memoria completa del sistema SGO (Sistema de Gestión de Obras) — arquitectura de microservicios, reglas de negocio (obras, costos, presupuesto, facturación, cuentas corrientes, saldos, comisiones, planes), estructura de carpetas y convenciones de código de cada módulo. Usar SIEMPRE antes de leer, escribir o modificar código en este repositorio, y al responder preguntas sobre cómo funciona el sistema, dónde vive algo, o por qué un cálculo da cierto resultado.
---

# SGO — Sistema de Gestión de Obras

Sistema multi-tenant de gestión de obras de construcción: presupuestación, ejecución,
facturación y cuentas corrientes de clientes y proveedores. Angular 19 + microservicios
Spring Boot 3 sobre SQL Server, detrás de un API Gateway con patrón BFF.

## Cómo usar esta skill

`SKILL.md` es el índice y las reglas no negociables. **Los detalles están en `references/`
— leé el archivo que corresponde antes de tocar código**, no trabajes de memoria:

| Necesitás… | Leé |
|---|---|
| Puertos, bases, gateway/BFF, multi-tenancy, infra, docker | `references/arquitectura.md` |
| Cómo se calcula algo: presupuesto, beneficio, saldo, deuda, estado de obra | `references/dominio-negocio.md` |
| Escribir/modificar Java (entidades, DTOs, services, Flyway, tests) | `references/backend.md` |
| Escribir/modificar Angular (componentes, servicios, forms, PrimeNG) | `references/frontend.md` |
| Ubicar un módulo: qué rutas, qué componentes, qué endpoints | `references/modulos.md` |
| Flujo de trabajo: qué reiniciar, versionado de migraciones, commits | `references/workflows.md` |

Regla práctica: para una tarea de backend leé `dominio-negocio.md` + `backend.md` +
la sección del módulo en `modulos.md`. Para frontend, `frontend.md` + `modulos.md`.

## Reglas no negociables

1. **El cálculo vive en el backend.** Saldos, cuentas corrientes, estados derivados,
   totales y agregados se resuelven en Java. El frontend **nunca** reconstruye una cuenta
   corriente ni recalcula un saldo: consume el contrato. Si el contrato no existe, se crea.
2. **Leé el archivo vecino antes de escribir.** El estilo local (nombres, orden de métodos,
   densidad de comentarios) manda sobre cualquier preferencia general.
3. **Dinero es `BigDecimal`** con `precision = 14, scale = 2` y `RoundingMode.HALF_UP`.
   Nunca `double` en lógica nueva de obras/reportes. (`transacciones-service` arrastra
   `Double` histórico: respetalo ahí, no lo propagues.)
4. **Hibernate nunca maneja el esquema**: `ddl-auto=none`. Todo cambio de tablas, índices o
   stored procedures va por una migración Flyway con sintaxis **SQL Server**.
5. **Multi-tenancy siempre**: toda query de listado filtra por `organizacion_id`. El gateway
   propaga `X-Organizacion-Id`; los services lo reciben y lo aplican. Un endpoint nuevo que
   no filtra por organización es un bug de seguridad.
6. **El frontend habla solo con el gateway** (`/bff/**` y `/auth/**`), nunca directo a un
   microservicio. Los endpoints se declaran en `environment.ts`.
7. **Componentes Angular `standalone: true`** con `imports` explícitos. Sin NgModules.
8. **Todos los modelos TypeScript en `core/models/models.ts`** — archivo único, sin excepciones.
9. **Entidades JPA con `@Getter @Setter @Builder`, nunca `@Data`** (rompe lazy loading).
10. **No llames a `auditLogService.save()`**: el `AuditLogFilter` audita automáticamente todo
    POST/PUT/PATCH/DELETE sobre `/api/**`.
11. **Al cerrar un cambio, informá explícitamente qué servicios reiniciar** (tabla abajo).

## Estados canónicos

Memorizá estos — son el eje de casi toda la lógica:

```
EstadoObraEnum:   PRESUPUESTADA → COTIZADA → ADJUDICADA → EN_PROGRESO → FINALIZADA
                                          ↘ PERDIDA
                  FACTURADA_PARCIAL → FACTURADA → COBRADA
EstadoPagoEnum:   PENDIENTE | PARCIAL | PAGADO
EstadoTareaEnum:  PENDIENTE | EN_PROGRESO | COMPLETADA
TipoCostoEnum:    ORIGINAL | ADICIONAL | AJUSTE | ECONOMIA
TipoTransaccion:  COBRO | PAGO
Estado factura:   EMITIDA | COBRADA   (string, no enum)
```

- `FACTURADA_TOTAL` está **deprecado**: el backend lo normaliza a `FACTURADA` al parsear.
  No ofrecerlo en combos ni generarlo.
- **`COTIZADA` no genera saldo ni deuda** y no aparece en cuentas corrientes ni en los
  filtros en cascada (migraciones V35 transacciones / V5 reportes). Es una cotización
  enviada, no confirmada.
- Generan **deuda de cliente**: `ADJUDICADA, EN_PROGRESO, FINALIZADA, FACTURADA,
  FACTURADA_PARCIAL, COBRADA`.
- Generan **saldo de proveedor**: `ADJUDICADA, EN_PROGRESO, FINALIZADA`.

## Servicios y puertos (verificado contra `docker-compose.yml`)

| Servicio | Puerto | Base | Raíz de paquete |
|---|---|---|---|
| frontend | 4200 | — | — |
| api-gateway | 8080 | — | `com.apigateway` |
| obras-service | 8081 | `sgo_obras` | `com.obras` |
| clientes-service | 8082 | `sgo_clientes` | `com.clientes` |
| proveedores-service | 8083 | `sgo_proveedores` | `proveedores` ⚠️ sin `com.` |
| reportes-service | 8084 | `sgo_reportes` | `com.reportes` |
| agendas-service | 8085 | `sgo_agendas` | `com.agendas` |
| transacciones-service | 8086 | `sgo_transacciones` | `com.transacciones` |
| documentos-service | 8087 | `sgo_documentos` | `com.documentos` |
| auth-service | 8089 | `sgo_auth` | `com.auth` |
| SQL Server 2022 | 1433 | — | — |
| MinIO | 9000 / 9001 | — | — |

`frontend/` es la fuente de verdad de Angular. `frontend1.2/` es build desplegado — **no editar**.

## Qué reiniciar

| Cambio | Reiniciar |
|---|---|
| Solo Angular | recargar navegador / rebuild frontend |
| Un microservicio | ese servicio |
| Contrato consumido por el frontend | el servicio + `api-gateway` + recargar frontend |
| Facturación | `transacciones-service` + `obras-service` + `api-gateway` |
| Reportes / cuentas corrientes | `reportes-service` + `api-gateway` |
| Documentos o notas | `documentos-service` + `api-gateway` |
| Planes, login, suscripciones | `auth-service` + `api-gateway` |
| Migración Flyway | el servicio dueño de la migración (corre al arrancar) |

## Checklist antes de cerrar

- [ ] Leí el archivo vecino y copié su estilo
- [ ] El cálculo quedó en backend, no en el template
- [ ] Filtro por `organizacion_id` aplicado en toda query nueva de listado
- [ ] Migración Flyway con el número correcto (ver `workflows.md` — hay colisiones históricas)
- [ ] Modelos TS en `core/models/models.ts`; componente `standalone: true`
- [ ] Entidad con `@Getter @Setter @Builder`; DTO Request/Response separados
- [ ] Tests: service con Mockito, controller BFF con `WebClient` stub
- [ ] Informé qué servicios reiniciar
