# AGENTS.md

## Objetivo
Documento vivo para dejar asentado:
- que tiene hoy el sistema
- que cambios ya fueron implementados
- que cosas siguen pendientes o requieren validacion funcional
- que servicios hay que reiniciar segun el tipo de cambio

## Arquitectura actual
- Frontend Angular: `frontend1.2`
- Backend Spring Boot microservicios: `backend1.0`
- Gateway/BFF: `api-gateway`
- Servicios principales:
  - `obras-service` puerto `8081`
  - `clientes-service` puerto `8082`
  - `proveedores-service` puerto `8083`
  - `reportes-service` puerto `8084`
  - `transacciones-service` puerto `8086`
  - `documentos-service` puerto `8087`
  - `api-gateway` puerto `8080`
- Infra adicional:
  - `minio` para archivos/documentos en entorno docker

## Base de datos
- En perfil `dev`, los servicios fueron ajustados para usar las bases comunes en `/data`
- No deben usar `*-dev.db`
- Los metadatos de documentos siguen en SQLite y los binarios pueden vivir en `uploads-dev/` o MinIO, segun entorno

## Regla operativa de cambios
- Los calculos de negocio, saldos, estados y agregados deben resolverse por backend siempre que corresponda
- El frontend no debe reconstruir cuentas corrientes ni saldos si ya existe o debe existir contrato backend para eso
- Al final de cada cambio hay que informar explicitamente que servicios reiniciar

## Cambios ya implementados

### Facturas
- Se corrigio el BFF para que `monto_restante` no sea obligatorio al crear factura
- El frontend y el gateway quedaron consistentes con ese contrato
- El listado de facturas ya normaliza el estado de la obra con pipe visual

### Obras
- El header del layout de detalle vuelve a mostrarse correctamente al navegar con query params, por ejemplo `/obras/19?tab=2`
- El label `Para facturar` se muestra en el header del layout junto al nombre de la obra
- El listado de obras:
  - muestra numero de orden
  - ordena ultima arriba
  - permite multiselect en filtro de estados
  - muestra label de facturacion
- Se incorporaron los estados de obra:
  - `FACTURADA_PARCIAL`
  - `FACTURADA_TOTAL`
- Esos estados pertenecen a la obra, no a la factura
- El cambio de estado de la obra por facturacion se hace automaticamente desde backend
- Se incorporo el item `AJUSTE` al presupuesto
- En tareas de obra se prioriza por defecto proveedor de tipo `MANO_DE_OBRA` / `MANO DE OBRA` segun los datos disponibles

### Reportes
- Se rehizo la logica de saldos desde backend
- `Me deben` y `Le debo` ya no deben calcularse en frontend
- Se excluyen saldos `0` o residuales
- El orden replica el criterio del modulo Obras
- Se mantienen decimales en beneficio global

### Proveedores
- El listado espera a que carguen tambien los saldos antes de salir de loading
- Columnas pedidas en listado:
  - `Nombre`
  - `Contacto`
  - `Telefono`
  - `Email`
  - `Tipo`
  - `Total`
  - `Saldo`
- Se corrigio el saldo total para que no sume obras fuera de `EN_PROGRESO` y `FINALIZADA`
- En detalle de proveedor:
  - se muestran obras relevantes
  - hay saldo por obra
  - hay accesos directos a consulta y movimientos

### Clientes
- El orden de columnas compartidas se alineo con Proveedores donde aplica

### Notas / Documentos
- Ya se permiten notas sin adjunto
- La UI no restringe tipos de archivo
- Se corrigio mezcla de notas/documentos entre obras filtrando tambien por `obraId`

## Cosas a validar funcionalmente
- Verificar con datos reales la transicion automatica de estados de obra:
  - parcial cuando factura menos que el presupuesto efectivo
  - total cuando alcanza el total facturable
  - cobrada cuando todo lo facturado queda cobrado
- Revisar si algun listado viejo sigue mostrando estados crudos sin pipe
- Confirmar si el filtro de vencimiento en Obras sigue pendiente como filtro dedicado

## Regla de reinicio por tipo de cambio
- Si cambia solo Angular: reiniciar o reconstruir `frontend1.2`
- Si cambia un microservicio backend: reiniciar ese servicio
- Si cambia contrato consumido por frontend:
  - reiniciar el microservicio afectado
  - reiniciar `api-gateway`
  - recargar frontend
- Si cambia logica transversal de facturacion:
  - reiniciar `transacciones-service`
  - reiniciar `obras-service` si toca estados de obra
  - reiniciar `api-gateway`
- Si cambia reportes:
  - reiniciar `reportes-service`
  - reiniciar `api-gateway`
- Si cambia documentos/notas:
  - reiniciar `documentos-service`
  - reiniciar `api-gateway`

## Formato sugerido para seguir anotando cambios
Agregar nuevas entradas al final de este archivo con:

### YYYY-MM-DD
- Cambio:
- Impacto funcional:
- Servicios a reiniciar:
- Observaciones:

## Bitacora

### 2026-03-19
- Cambio: se creo este `AGENTS.md` para consolidar estado actual del sistema y acuerdos de trabajo
- Impacto funcional: no cambia comportamiento de runtime
- Servicios a reiniciar: ninguno
- Observaciones: a partir de ahora, al cierre de cada cambio se debe informar explicitamente que servicios reiniciar

### 2026-03-19
- Cambio: se unifico el estado de obra `FACTURADA_TOTAL` dentro de `FACTURADA`
- Impacto funcional: las obras ahora deben manejarse con `FACTURADA_PARCIAL`, `FACTURADA` y `COBRADA`; si aparece `FACTURADA_TOTAL` en datos viejos, backend lo interpreta como `FACTURADA`
- Servicios a reiniciar: `obras-service`, `transacciones-service`, `api-gateway`, recargar frontend
- Observaciones: se actualizaron tambien los ordenamientos y combos visuales para no ofrecer `FACTURADA_TOTAL`
