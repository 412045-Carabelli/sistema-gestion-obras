# Reglas de negocio de SGO

Fuente de verdad del cálculo. Si algo de este archivo contradice al código, gana el código
— pero avisá, porque significa que la regla cambió y hay que actualizar esto.

Archivos donde vive cada cálculo:
- `backend1.0/obras-service/.../service/impl/ObraServiceImpl.java` — totales de obra
- `backend1.0/obras-service/.../service/costo/*.java` — estrategias por tipo de costo
- `backend1.0/transacciones-service/.../service/FacturaService.java` — facturación y estado automático
- `backend1.0/transacciones-service/.../service/TransaccionService.java` — cobros y pagos
- `backend1.0/reportes-service/.../service/ReportesService.java` — cuentas corrientes, deudas, KPIs
- `backend1.0/*/src/main/resources/db/migration/*.sql` — stored procedures de deudas y filtros

---

## 1. Glosario

| Término | Significado |
|---|---|
| **Obra** | Proyecto de construcción. Unidad central del sistema. Pertenece a un cliente y opcionalmente a un grupo. |
| **Grupo de obras** | Agrupación de obras para consolidar saldos (ej. un mismo desarrollo con varias unidades). |
| **Costo de obra** (`obra_costo`) | Ítem del presupuesto: cantidad × precio unitario, con un tipo y un proveedor opcional. |
| **Presupuesto** | Total de la obra que se le cobra al cliente. **Derivado de los costos**, no se carga a mano. |
| **Beneficio** | Margen aplicado sobre el costo. Puede ser global (un % para toda la obra) o por ítem. |
| **Comisión** | % que se paga a un tercero sobre el total con beneficio. Reduce el beneficio neto. |
| **Monto real** | Lo que efectivamente costó un ítem. Comparado contra lo presupuestado da economía o demasía. |
| **Economía** | Ahorro: se gastó menos de lo presupuestado en un ítem. |
| **Demasía** | Sobrecosto: se gastó más de lo presupuestado. |
| **Transacción** | Movimiento de dinero. `COBRO` (entra, de un cliente) o `PAGO` (sale, a un proveedor). |
| **Factura** | Comprobante emitido al cliente contra una obra. `EMITIDA` o `COBRADA`. |
| **Cuenta corriente** | Saldo pendiente por obra: cliente (presupuesto − cobrado) o proveedor (presupuestado − pagado). |
| **Organización** | Tenant. Todo dato de negocio lleva `organizacion_id`. |

---

## 2. Ciclo de vida de la obra

```
PRESUPUESTADA   Borrador interno. No genera saldo ni deuda.
COTIZADA        Cotización enviada al cliente, sin confirmar.
                *** NO genera saldo, NO aparece en cuentas corrientes,
                    NO aparece en filtros en cascada. ***
ADJUDICADA      El cliente confirmó. A partir de acá genera deuda y saldo de proveedor.
EN_PROGRESO     En ejecución.
FINALIZADA      Obra terminada (puede quedar sin facturar/cobrar).
PERDIDA         Cotización rechazada. Estado terminal.

FACTURADA_PARCIAL / FACTURADA / COBRADA
                Estados de facturación. Los setea el backend automáticamente,
                nunca el usuario a mano.
```

**Transición automática por facturación** (`FacturaService.actualizarEstadoObraSegunFacturacion`),
disparada al crear, actualizar o eliminar una factura:

```
facturado = Σ monto de las facturas de la obra
si facturado <= 0.01              → no toca el estado
si facturado + 0.01 < presupuesto → FACTURADA_PARCIAL
si total facturado y todas COBRADA→ COBRADA
si total facturado                → FACTURADA
```

Si el llamado a obras-service falla, se ignora silenciosamente: la factura se guarda igual.

**`FACTURADA_TOTAL` está deprecado.** `ObraServiceImpl.parseEstado()` lo normaliza a
`FACTURADA` al recibirlo. No generarlo ni ofrecerlo en combos.

**Restricción de beneficio**: no se puede modificar `beneficio_global` ni `beneficio` cuando la
obra está en `ADJUDICADA`, `EN_PROGRESO` o `FINALIZADA` → `IllegalArgumentException`.

**Baja lógica de obra** (`activar()` es un toggle): al desactivar una obra se desactivan en
cascada sus costos y tareas; al reactivarla se reactivan. Los costos con `baja_obra = true`
siguen mostrándose en obras inactivas para conservar el histórico.

**Validación de fechas**: `fecha_inicio` no puede ser posterior a `fecha_fin`.

---

## 3. Cálculo del presupuesto de la obra

`ObraServiceImpl.calcularTotalesObra()` recorre los costos activos y aplica una **estrategia
según el tipo de costo** (`CostoTipoStrategyFactory.obtener(tipoCosto, idProveedor)`).

Para cada costo: `base = cantidad × precio_unitario` (o `subtotal` si ya está guardado).

| Tipo | ¿Con proveedor? | `subtotalEfectivo` | `beneficioMonto` |
|---|---|---|---|
| `ORIGINAL` | — | `base` | `base × pct / 100`, donde `pct` = `obra.beneficio` si `beneficio_global`, si no el `beneficio` del ítem |
| `ADICIONAL` / `AJUSTE` | **sí** | `base` | `base × beneficio_ítem / 100` (nunca usa el global) |
| `ADICIONAL` / `AJUSTE` | **no** | `0` | `base` — es ganancia pura, no hay costo real que pagar |
| `ECONOMIA` | — | `base` (negativo) | `0` |

`ECONOMIA` **exige subtotal negativo** (`precio_unitario < 0`) o lanza `IllegalArgumentException`.
Resta directo del presupuesto y no lleva beneficio.

Agregados:

```
subtotal_costos    = Σ subtotalEfectivo(base)
beneficio_costos   = Σ beneficioMonto(base, beneficio_ítem, obra)
total_con_beneficio= subtotal_costos + beneficio_costos
comision_monto     = tiene_comision ? total_con_beneficio × comision/100 : 0
economia_obra      = Σ (base − monto_real)  donde la diferencia sea > 0
demasia_obra       = Σ |base − monto_real|  donde la diferencia sea < 0
desvio_total       = economia_obra − demasia_obra
beneficio_neto     = beneficio_costos − comision_monto + desvio_total
presupuesto        = total_con_beneficio      ← esto es lo que se le cobra al cliente
```

Todo con `setScale(2, HALF_UP)`; los porcentajes se dividen con escala 6 antes de redondear.

**El presupuesto se recalcula y se persiste en cada `actualizar()`** para que el listado y el
detalle nunca se desincronicen. Nunca lo escribas a mano.

**Anti N+1**: los listados usan `obtenerCostosActivosBulk()` — una sola query de costos para
todas las obras de la página. Si agregás un listado nuevo, seguí ese patrón.

**Orden de los costos en el DTO**: primero los `ORIGINAL`, después el resto, y dentro de cada
grupo por `id` ascendente.

---

## 4. Facturación

`FacturaService` (transacciones-service, tabla `facturas`).

- **Estado**: solo `EMITIDA` o `COBRADA`. Cualquier otro valor → error. Default `EMITIDA`.
- **`monto_restante`**: opcional al crear; si no viene, se iguala al `monto`. Si el estado es
  `COBRADA`, se fuerza a `0`.
- **Tope contra presupuesto** (`validarMontoContraPresupuesto`): la suma de facturas de la obra
  no puede superar el presupuesto. Tolerancia `0.01`. Al editar, se excluye la propia factura
  del acumulado.
- **Adjunto**: se guarda en `{upload-dir}/facturas/{idCliente}/{timestamp}_{nombre}`, con el
  nombre saneado a `[a-zA-Z0-9._-]`. Al reemplazar el archivo se borra el anterior; al eliminar
  la factura también.
- **"Impacta cuenta corriente" está deshabilitado** a pedido: el checkbox se quitó del frontend
  y el flag se persiste siempre en `false`. El código de `crearOActualizarMovimiento()` quedó
  comentado a propósito para no alterar datos históricos de facturas viejas que lo tenían en
  `true`. **No lo reactives sin pedido explícito.**
- Crear, actualizar y eliminar disparan el recálculo del estado de la obra (§2).

---

## 5. Transacciones (cobros y pagos)

`TransaccionService`. Tabla `transacciones`, con `id_tipo_transaccion` (`COBRO`/`PAGO`),
`tipo_asociado` (`CLIENTE`/`PROVEEDOR`), `id_asociado`, `id_obra`, `monto`, `fecha`,
`forma_pago`, `medio_pago`, `concepto`.

- `tipo_transaccion` es obligatorio; se valida junto con `tipo_asociado`.
- El monto se valida contra el presupuesto/saldo disponible de la obra antes de guardar.
- `forma_pago` se deriva: `TOTAL` si el monto cubre exactamente el restante (tolerancia `0.01`),
  `PARCIAL` si no. Si supera el restante → error.
- **Baja lógica**: `activo = false`. `desactivarPorObra` / `activarPorObra` propagan la baja de
  la obra. `baja_obra` distingue "dado de baja por baja de obra" de "dado de baja individualmente".
- **Anti N+1**: `mapearActivasConCacheDeObras()` precalcula obras y cobros acumulados una vez
  por obra distinta en vez de una llamada por transacción.
- **Comisión**: `registrarPagoComision(obraId, monto, fecha)` registra el pago de comisión de una
  obra. La comisión pendiente = comisión calculada − pagos de comisión ya registrados.

---

## 6. Cuentas corrientes y saldos

Se resuelven en `reportes-service` (`ReportesService` + stored procedures de SQL Server).

**Saldo de cliente por obra** = `presupuesto − Σ cobros activos de la obra`
**Saldo de proveedor por obra** = `Σ costos presupuestados del proveedor − Σ pagos activos a ese proveedor en la obra`

Filtros que aplican **siempre**:

```
obra.activo = 1
obra.estado_obra IN (ADJUDICADA, EN_PROGRESO, FINALIZADA)   ← SPs de deudas
transaccion.activo = 1
costo.activo = 1
organizacion_id = @organizacion_id (si viene)
saldo > 0   ← salvo que @incluirSaldoCero = 1 (V36)
```

- **`COTIZADA` está excluida** de todos los SPs de cuenta corriente y de los filtros en cascada
  (V35 transacciones / V5 reportes). V31 la había incluido por error.
- **`@incluirSaldoCero`** (V36, default `0`): permite listar obras/proveedores con saldo `0`
  cuando el usuario tilda el filtro correspondiente en el frontend.
- En Java, `tieneSaldoSignificativo(saldo)` = `saldo > 0.01` — así se descartan residuales.
  `saldoPositivo()` **no** clampea a cero: devuelve el saldo real, incluso negativo.
- **`costoBase(costo)`** para reportes usa `monto_real` si existe (gasto real), y cae a
  `subtotal`, luego `cantidad × precio_unitario`, luego `total`.
- **Orden**: los listados replican el criterio del módulo Obras — `creado_en DESC, nombre`.
- Los estados llegan normalizados (`trim → upper → espacios a "_" → quitar no alfanuméricos`),
  así que `"en progreso"` y `"EN_PROGRESO"` matchean igual.

**Conjuntos de estados en `ReportesService`** (constantes, no las dupliques):

```java
ESTADOS_CON_DEUDA       = {ADJUDICADA, EN_PROGRESO, FINALIZADA, FACTURADA, FACTURADA_PARCIAL, COBRADA}
ESTADOS_SALDO_PROVEEDOR = {ADJUDICADA, EN_PROGRESO, FINALIZADA}
ESTADOS_KPI_FACTURAS    = {ADJUDICADA, EN_PROGRESO, FINALIZADA, COBRADA, FACTURADA, FACTURADA_PARCIAL, FACTURADA_TOTAL}
```

**Stored procedures** (transacciones-service, `db/migration`):
`sp_deudas_globales_con_grupo`, `sp_deudas_proveedores_con_grupo`, `sp_obtener_obras_por_cliente`,
`sp_obtener_proveedores_por_cliente`, `sp_obtener_obras_por_proveedor`,
`sp_obtener_clientes_por_proveedor`, `sp_obtener_proveedores_por_obra`, `sp_obtener_clientes_por_obra`.

Son **cross-database**: reciben los schemas (`sgo_obras`, `sgo_clientes`, `sgo_proveedores`,
`sgo_transacciones`) como parámetro y arman SQL dinámico con `QUOTENAME`. Se recrean enteros con
`CREATE OR ALTER` en cada migración que los toca — **copiá la última versión vigente y modificá
sobre esa**, si no perdés cambios previos.

---

## 7. Tareas y agenda

- `EstadoTareaEnum`: `PENDIENTE | EN_PROGRESO | COMPLETADA`.
- Las tareas de obra viven en `obras-service` (`/api/obras/tareas`); la agenda general y el
  Gantt en `agendas-service`.
- En tareas de obra se prioriza por defecto el proveedor de tipo `MANO_DE_OBRA` / `MANO DE OBRA`.
- `NotificacionTareasScheduler` (obras) y `NotificacionAgendaScheduler` (agendas) disparan
  notificaciones programadas; hay integración WhatsApp vía WAHA + n8n.

---

## 8. Documentos y notas

- Tipos: `FACTURA, RECIBO, REMITO, PAGARE, COMPROBANTE, OTRO`.
- **Se permiten notas sin adjunto** y la UI **no restringe tipos de archivo**.
- Los documentos se filtran **también por `obraId`** — sin eso se mezclaban notas entre obras.
- Metadatos en SQL Server; binarios en MinIO (o `uploads-dev/` en dev).

---

## 9. Planes y suscripciones (auth-service)

Códigos: `FREE`, `BASICO`, `PROFESIONAL`, `ENTERPRISE`. Un `Plan` define:

**Límites** (`null` = ilimitado): `maxUsuarios`, `maxObrasActivas`, `maxClientes`,
`maxProveedores`, `maxTransaccionesMes`, `maxStorageMb`, `diasHistorialReportes`
(`null` = ∞, `0` = sin acceso, `30` = últimos 30 días).

**Feature flags**: `tieneFacturas`, `tieneAgenda`, `tieneGruposObras`, `tieneExportar`,
`tienePushNotifications`, `tieneSoportePrioritario`, `tieneApiAccess`, `tieneWhatsappBot`,
`tieneGantt`.

- La `Organizacion` apunta a un `Plan` y a `suscripcionActivaId`.
- **Cobro por Mercado Pago** (`preapproval_plan`): el plan guarda
  `mpPreapprovalPlanIdMensual` / `mpPreapprovalPlanIdAnual`. Precios en USD
  (`precioMensualUsd`, `precioAnualUsd`), convertidos con `ExchangeRateService`.
- En el frontend, `planGuard('facturas' | 'agenda' | 'grupos_obras' | ...)` bloquea la ruta y
  redirige a `/planes?feature=<x>`. El `plan-limit.interceptor.ts` maneja los 4xx de límite.
- Rutas de retorno de MP (`/suscripcion/exito|pendiente|error`) **no** llevan `authGuard`:
  Mercado Pago redirige ahí sin el JWT en contexto.

**Seguridad de login**: `Usuario` lleva `intentosFallidos` y `bloqueadoHasta`, con desbloqueo
automático al vencer. `LoginRateLimitFilter` limita intentos por IP.
