# Arquitectura de SGO

## Estructura del repositorio

```
sistema-gestion-obras/
├── frontend/                 ← Angular 19. FUENTE DE VERDAD del front.
├── frontend1.2/              ← build desplegado. NO EDITAR.
├── backend1.0/               ← microservicios Spring Boot (pom.xml padre)
│   ├── api-gateway/          ← WebFlux, BFF, JWT, CORS
│   ├── auth-service/         ← usuarios, organizaciones, planes, Mercado Pago
│   ├── obras-service/        ← obras, costos, tareas, progresos, grupos, saldos
│   ├── clientes-service/
│   ├── proveedores-service/
│   ├── transacciones-service/← transacciones, facturas, flujo de caja, dashboard
│   ├── reportes-service/     ← cuentas corrientes, deudas, KPIs, PDFs
│   ├── documentos-service/   ← WebFlux + MinIO
│   ├── agendas-service/      ← agenda general, Gantt, WhatsApp
│   └── common/               ← DTOs compartidos (com.common.dto.*)
├── db/                       ← scripts SQL iniciales
├── bot-whatsapp/             ← bot Node (WAHA)
├── n8n/                      ← workflows de automatización
├── data/                     ← bases de dev
├── docker-compose.yml        ← entorno local
├── docker-compose.ghcr.yml   ← imágenes publicadas
├── AGENTS.md                 ← bitácora de cambios (parcialmente desactualizada)
└── CLAUDE.md                 ← estándares de codificación
```

⚠️ `AGENTS.md` menciona `frontend1.2` como el front activo y SQLite como base: **está
desactualizado**. Hoy el front activo es `frontend/` y la base es SQL Server 2022.

## Servicios

| Servicio | Puerto | Container | Base | Paquete | Stack |
|---|---|---|---|---|---|
| frontend | 4200 (→80) | `obras_frontend_v2` | — | — | Angular 19 |
| api-gateway | 8080 | `api_gateway_service_local_v2` | — | `com.apigateway` | **WebFlux** |
| obras-service | 8081 | `obras_service_local_v2` | `sgo_obras` | `com.obras` | MVC |
| clientes-service | 8082 | `clientes_service_local_v2` | `sgo_clientes` | `com.clientes` | MVC |
| proveedores-service | 8083 | `proveedores_service_local_v2` | `sgo_proveedores` | `proveedores` ⚠️ | MVC |
| reportes-service | 8084 | `reportes_service_local_v2` | `sgo_reportes` | `com.reportes` | MVC |
| agendas-service | 8085 | `agendas_service_local_v2` | `sgo_agendas` | `com.agendas` | MVC |
| transacciones-service | 8086 | `transacciones_service_local_v2` | `sgo_transacciones` | `com.transacciones` | MVC |
| documentos-service | 8087 | `documentos_service_local_v2` | `sgo_documentos` | `com.documentos` | **WebFlux** |
| auth-service | 8089 | `auth_service_local_v2` | `sgo_auth` | `com.auth` | MVC + Security |

`proveedores-service` es la única excepción de naming: su raíz es `proveedores`, **sin** `com.`.

## Infraestructura

| Componente | Puerto | Rol |
|---|---|---|
| SQL Server 2022 | 1433 | `sgo_sqlserver_v2`. Una base por servicio. |
| migrador | — | `sgo_migrador_v2`, corre al levantar el stack |
| MinIO | 9000 / 9001 | binarios de documentos |
| backup | — | `sgo_backup` |
| n8n | 5678 | automatizaciones |
| WAHA | 3000 | HTTP API de WhatsApp |
| bot-whatsapp | 4000 | bot Node propio |

Versiones: Spring Boot 3.x / Java 17 / Lombok 1.18.34 / driver `mssql-jdbc` 12.6.1 /
Flyway (con `flyway-sqlserver`). El pom padre `backend1.0/pom.xml` versiona `1.15.35`.

## Gateway y patrón BFF

El frontend **solo** habla con el gateway. Prefijos:

- `/bff/**` → un `*BffController` en `com.apigateway.controller` que llama al microservicio
  con `WebClient` y devuelve el contrato que el front necesita.
- `/auth/**` → auth-service (login, registro, planes, Mercado Pago).
- `/api/legal` → páginas legales servidas por el gateway.

Prefijos BFF existentes: `agendas, clientes, condicion-iva, configuracion, costos, dashboard,
documentos, estado-pago, estados-obras, facturas, gremios, mp, notificaciones, obras,
proveedores, push, reportes, tareas, tipo-documentos, tipo-proveedor, tipo-transaccion,
transacciones, whatsapp`.

Prefijos internos de los microservicios (nunca los consume el navegador directamente):

```
/api/obras           /api/obras/costos     /api/obras/estados    /api/obras/tareas
/api/obras/progreso  /api/obras/obra-proveedor  /api/obras/estados-tareas
/api/grupos-obras    /api/saldos           /api/saldos-grupos
/api/clientes        /api/configuracion
/api/transacciones   /api/transacciones/dashboard  /api/transacciones/tipo-transaccion
/api/facturas        /api/flujo-caja
/api/reportes        /api/documentos       /api/documentos/tipo-documentos
/api/agenda/tareas   /api/agenda/whatsapp
/auth  /auth/admin   /auth/mp   /push
```

Clases del gateway relevantes:
- `filter/JwtAuthenticationFilter.java`, `filter/JwtAuthFilter.java` — validación de JWT
- `filter/SecurityHeadersFilter.java` — headers de seguridad
- `config/OrganizacionPropagationFilter.java` — propaga `X-Organizacion-Id` al contexto reactivo
- `config/CorsGlobalConfig.java`, `config/SecurityConfig.java`
- `service/ResilientWebClientService.java` — llamadas con resiliencia
- `service/PushTriggerService.java` — disparo de push notifications

## Multi-tenancy

- Cada tabla de negocio lleva `organizacion_id`.
- El JWT identifica al usuario y su organización; el gateway propaga el header
  **`X-Organizacion-Id`** (constante `OrganizacionPropagationFilter.ORGANIZACION_ID_KEY`).
- Los services reciben `organizacionId` y filtran: `findByOrganizacionId(...)`, o el parámetro
  `@organizacion_id` en los stored procedures.
- Patrón defensivo habitual: `if (organizacionId != null && organizacionId > 0) filtrar; else findAll()`.
  Respetalo para no romper llamadas internas entre servicios.
- El header de auditoría es **`X-User-Name`**, lo lee el `AuditLogFilter` de cada servicio.

**Toda query de listado nueva debe filtrar por organización.** Un endpoint que no lo hace
filtra datos entre tenants.

## Comunicación entre servicios

- MVC: `RestTemplate` (`config/RestTemplateConfig.java` o `RestClientConfig.java`), con clases
  cliente dedicadas: `ObrasClient`, `TransaccionesClient`, `ClientesClient`, `ProveedoresClient`,
  `FacturasClient`, `ObraCostoClient`.
- WebFlux (gateway, documentos): `WebClient` (`config/WebClientConfig.java`).
- Las URLs se inyectan con `@Value("${services.<x>.url}")` — nunca hardcodeadas.
- Los DTOs de respuesta ajena viven en `dto/external/` (ej. `com.reportes.dto.external.ObraExternalDto`).
  No importes entidades de otro servicio.
- Regla de resiliencia: si una llamada secundaria falla, **no** tumbes la operación principal
  (ver `actualizarEstadoObraSegunFacturacion`, que traga la excepción a propósito).

## Base de datos

- SQL Server 2022, **una base por servicio**. No hay FKs cross-database: las relaciones entre
  servicios son por id, resueltas en la capa de aplicación o con SQL dinámico en los SPs.
- `spring.jpa.hibernate.ddl-auto=none` — el esquema lo maneja **solo Flyway**.
- Migraciones en `backend1.0/{servicio}/src/main/resources/db/migration/V{n}__{desc}.sql`.

## Frontend → gateway

`frontend/src/environments/environment.ts` declara `apiGateway: 'http://localhost:8080'` y el
mapa `endpoints`. Todo servicio Angular construye su URL como
`${environment.apiGateway}${environment.endpoints.<x>}`. **Nunca** hardcodees un host o un puerto
de microservicio en el front.
