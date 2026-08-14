# Mapa de módulos

Para cada módulo: ruta del front, componentes, servicio Angular, prefijo BFF, servicio backend
y notas de negocio. Usalo para ubicarte rápido antes de abrir archivos.

## Rutas de la aplicación (`app.routes.ts`)

| Ruta | Guard | Componente |
|---|---|---|
| `/` | — | redirige a `/dashboard` si hay `sgo_access_token`, si no a `/home` |
| `/home` | pública | `LandingComponent` (lazy) |
| `/login`, `/register` | públicas | lazy |
| `/terminos`, `/privacidad` | públicas | legal |
| `/dashboard` | auth | `DashboardComponent` (lazy) |
| `/tareas` | auth | `TareasComponent` (lazy) |
| `/obras` | auth | layout + list / `nueva` / `:id` / `editar/:id` |
| `/clientes` | auth | layout + list / `nueva` / `:id` / `editar/:id` |
| `/proveedores` | auth | layout + list / `nueva` / `:id` / `editar/:id` |
| `/facturas` | auth + `planGuard('facturas')` | layout + list |
| `/agendas`, `/agendas/gantt` | auth + `planGuard('agenda')` | layout + list / gantt |
| `/grupos` | auth + `planGuard('grupos_obras')` | layout + `GruposObrasComponent` |
| `/cuentas-corrientes` | auth | layout + `CuentaCorrienteComponent` |
| `/movimientos` | auth | layout + `MovimientosListComponent` |
| `/reportes` | auth | `ReportesComponent` |
| `/configuracion` | auth (`/usuarios` además `adminGuard`) | layout + config + usuarios-admin |
| `/planes`, `/mi-plan`, `/checkout` | auth | lazy |
| `/suscripcion/exito\|pendiente\|error` | **sin guard** | retorno de Mercado Pago |

---

## Obras

El módulo central. Todo lo demás cuelga de acá.

- **Front**: `features/obras-layout/`, `features/pages/obras-{create,detail,edit}/`,
  `features/components/obra-list/`, `obra-costos-table/`, `obra-presupuesto/`,
  `obra-movimientos/`, `obra-tareas/`, `obra-documentos/`, `costo-detalle-modal/`,
  `resumen-obras/`
- **Servicios**: `services/obras/obras.service.ts` (+ `obras-state.service.ts`),
  `services/costos/`, `services/estado-obra/`, `services/estado-pago/`,
  `services/obras-proveedores/`
- **BFF**: `/bff/obras`, `/bff/costos`, `/bff/estados-obras`, `/bff/estado-pago`, `/bff/tareas`
- **Backend**: `obras-service` — `/api/obras`, `/api/obras/costos`, `/api/obras/estados`,
  `/api/obras/tareas`, `/api/obras/progreso`, `/api/obras/obra-proveedor`, `/api/saldos`

Notas:
- El listado muestra número de orden, ordena la última arriba, permite multiselect de estados y
  muestra el label de facturación.
- El header del layout muestra el nombre de la obra + label "Para facturar", y debe seguir
  visible al navegar con query params (`/obras/19?tab=2`).
- El presupuesto se **deriva de los costos** (ver `dominio-negocio.md` §3), no se carga a mano.
- El detalle tiene tabs: presupuesto/costos, movimientos, tareas, documentos.

## Costos de obra

- **Front**: `obra-costos-table/`, `costo-detalle-modal/`, `obra-presupuesto/`
- **Backend**: `ObraCostoServiceImpl` + `service/costo/*Strategy.java`
- Tipos: `ORIGINAL`, `ADICIONAL`, `AJUSTE`, `ECONOMIA`. Cada uno calcula distinto — ver
  `dominio-negocio.md` §3 antes de tocar nada del cálculo.
- Un costo puede tener proveedor o no, y eso **cambia el cálculo** de `ADICIONAL`/`AJUSTE`.
- `monto_real` vs presupuestado genera economía / demasía.
- `estado_pago`: `PENDIENTE | PARCIAL | PAGADO`.

## Clientes

- **Front**: `features/clientes-layout/`, `pages/clientes-{create,detail,edit}/`,
  `components/clientes-list/`, `clientes-documentos/`
- **Servicio**: `services/clientes/` (+ state)
- **BFF**: `/bff/clientes`, `/bff/condicion-iva`
- **Backend**: `clientes-service` `/api/clientes`; entidades `Cliente`, `CondicionIva`;
  clientes de `ObrasClient` y `TransaccionesClient`
- El orden de columnas compartidas se alineó con Proveedores donde aplica.

## Proveedores

- **Front**: `features/proveedores-layout/`, `pages/proveedores-{create,detail,edit}/`,
  `components/proveedores-list/`, `proveedores-form/`, `proveedor-quick-create/`,
  `proveedor-quick-modal/`
- **BFF**: `/bff/proveedores`, `/bff/tipo-proveedor`, `/bff/gremios`
- **Backend**: `proveedores-service` (paquete raíz `proveedores`, sin `com.`);
  entidades `Proveedor`, `TipoProveedor`, `Gremio`, `Movimiento`; `ProveedorFinanzasService`

Notas:
- Columnas del listado: Nombre, Contacto, Teléfono, Email, Tipo, Total, Saldo.
- El listado **espera también los saldos** antes de salir de loading.
- El saldo total **no** suma obras fuera de `EN_PROGRESO` / `FINALIZADA`.
- El detalle muestra obras relevantes, saldo por obra y accesos a consulta y movimientos.
- Tipo `MANO_DE_OBRA` / `MANO DE OBRA` se prioriza por defecto en tareas de obra.

## Facturas

- **Front**: `features/facturas-layout/`, `components/facturas-list/`, `factura-modal/`
- **Servicio**: `services/facturas/` (+ state)
- **BFF**: `/bff/facturas` (`FacturaBffController`)
- **Backend**: `transacciones-service` `/api/facturas` → `FacturaService`
- Requiere feature de plan `facturas`.
- Estado `EMITIDA | COBRADA`; `monto_restante` opcional al crear; tope contra presupuesto;
  el estado de la obra se actualiza solo. Ver `dominio-negocio.md` §4.
- El listado normaliza el estado de la obra con un pipe visual.
- "Impacta cta. cte." está **deshabilitado** a propósito (checkbox removido, flag siempre `false`).

## Transacciones / Movimientos

- **Front**: `features/movimientos-layout/`, `components/movimientos-list/`, `obra-movimientos/`
- **Servicios**: `services/transacciones/`, `services/movimientos/`
- **BFF**: `/bff/transacciones`, `/bff/tipo-transaccion`, `/bff/dashboard`
- **Backend**: `transacciones-service` — `TransaccionService`, `FlujoCajaService`,
  `DashboardService`
- `COBRO` (cliente) / `PAGO` (proveedor). Ver `dominio-negocio.md` §5.

## Cuentas corrientes

- **Front**: `features/cuenta-corriente-layout/`, `pages/cuenta-corriente/`,
  `components/cuentas-corrientes-list/`
- **Servicio**: `services/reportes/`
- **BFF**: `/bff/reportes`
- **Backend**: `reportes-service` `/api/reportes` → `ReportesService` + stored procedures
- Cliente: presupuesto − cobrado. Proveedor: presupuestado − pagado.
- `COTIZADA` excluida; filtro opcional `incluirSaldoCero`; solo obras activas en
  `ADJUDICADA / EN_PROGRESO / FINALIZADA`. Ver `dominio-negocio.md` §6.
- La página abre modales con el historial por cliente y por proveedor.
- Hay export a PDF (`CuentaCorrientePdfResponse`, `service/pdf/PdfBuilder.java`).

## Reportes y dashboard

- **Front**: `pages/reportes/`, `pages/dashboard/`, `components/dashboard-widgets/`,
  `shared/kpi-card/`
- **Servicios**: `services/reportes/`, `services/dashboard/`
- **Backend**: `reportes-service` (`ReportesService`, ~2900 líneas) y
  `transacciones-service` (`DashboardController`)

Reportes disponibles: dashboard financiero y consolidado, deudas globales, cuentas corrientes
combinadas, ingresos/egresos, estado financiero de obra, flujo de caja, pendientes, estado de
obras, avance de tareas, avance de pagos, costos por categoría, resumen general, comisiones,
ranking de clientes y proveedores, KPIs de facturas, notas por obra, filtros en cascada.

Notas:
- "Me deben" / "Le debo" se calculan **en backend**, nunca en el front.
- Se excluyen saldos `0` o residuales (`> 0.01`); el orden replica el de Obras.
- Se mantienen decimales en el beneficio global.

## Grupos de obras

- **Front**: `features/grupos-layout/`, `pages/grupos-obras/`, `components/saldos-grupos/`
- **Servicios**: `services/grupos-obras/`, `services/saldos-grupos/`
- **Backend**: `obras-service` `/api/grupos-obras`, `/api/saldos-grupos`
- Requiere feature de plan `grupos_obras`.

## Tareas y agenda

- **Front**: `pages/tareas/` (tareas de obra), `features/agendas-layout/`,
  `components/agendas-list/`, `agendas-gantt/`
- **Servicios**: `services/tareas/`, `services/agendas/`
- **BFF**: `/bff/tareas`, `/bff/agendas`, `/bff/whatsapp`, `/bff/notificaciones`
- **Backend**: tareas de obra en `obras-service` `/api/obras/tareas`; agenda general en
  `agendas-service` `/api/agenda/tareas` y `/api/agenda/whatsapp`
- Agenda y Gantt requieren features de plan `agenda` / `gantt`.
- Schedulers de notificación en ambos servicios.

## Documentos y notas

- **Front**: `components/obra-documentos/`, `clientes-documentos/`
- **Servicio**: `services/documentos/`
- **BFF**: `/bff/documentos`, `/bff/tipo-documentos`
- **Backend**: `documentos-service` (**WebFlux**) `/api/documentos`; MinIO para binarios
- Notas sin adjunto permitidas; sin restricción de tipo de archivo; filtrar **también por
  `obraId`** para no mezclar notas entre obras.

## Auth, planes y suscripciones

- **Front**: `pages/login/`, `register/`, `change-password/`, `configuracion/`,
  `configuracion/usuarios-admin/`, `planes/`, `mi-plan/`, `checkout/`,
  `suscripcion-resultado/`, `shared/upgrade-banner/`
- **Servicios**: `services/auth/`, `services/plan/`, `services/mercadopago/`, `services/push/`
- **BFF**: `/auth`, `/bff/mp`, `/bff/push`, `/bff/configuracion`
- **Backend**: `auth-service` — `AuthController`, `AdminController`, `PlanController`,
  `MercadoPagoController`, `DescuentoController`, `PushController`
- Ver `dominio-negocio.md` §9 para planes, límites y feature flags.

## Configuración

- **Front**: `pages/configuracion/`
- **BFF**: `/bff/configuracion`
- **Backend**: `obras-service` `/api/configuracion` (entidad `AppConfig`)

## Integraciones externas

- **Mercado Pago** — suscripciones (`preapproval_plan`), `auth-service`
- **TusFacturas** — emisión electrónica (`TusFacturasService`, `EmisionElectronicaRequest`)
- **WAHA + n8n + bot-whatsapp** — notificaciones y bot de WhatsApp
- **MinIO** — almacenamiento de documentos
- **Web Push** — `PushNotificationService`, `PushSubscription`
