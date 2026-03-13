# Backend Microservicios â€“ GestiÃ³n de Obras (Spring Boot + SQLite)

## MÃ³dulos
- **api-gateway**: enrutamiento (no agrega lÃ³gica).
- **clientes-obras.obras.obras.service**: CRUD de clientes.
- **proveedores-obras.obras.obras.service**: CRUD de proveedores y tipos de proveedor.
- **catalogos-obras.obras.obras.service**: catÃ¡logos para selects (estados, tipos).
- **obras-obras.obras.obras.service**: nÃºcleo de obras, costos, tareas, relaciÃ³n obraâ€“proveedor, progreso.
- **documentos-obras.obras.obras.service**: documentos vinculados a obra (ruta en disco).
- **transacciones-obras.obras.obras.service**: flujo de caja (cobros/pagos).
- **reportes-obras.obras.obras.service**: endpoints de reporte por contexto (opcional).

Cada servicio usa **SQLite** con archivo propio `./data/<servicio>.db` y **no llama a otros servicios** (independencia total).

## Endpoints clave que el front debe usar

### Obras
- `POST   /api/v1/obras` â€“ crear
- `GET    /api/v1/obras?page=&size=` â€“ listar
- `GET    /api/v1/obras/{id}` â€“ detalle
- `PUT    /api/v1/obras/{id}` â€“ actualizar
- `PATCH  /api/v1/obras/{id}/estado/{idEstado}` â€“ cambiar estado
- `PATCH  /api/v1/obras/{id}/activo?value=true|false` â€“ activar/desactivar

**RelaciÃ³n Obraâ€“Proveedor**
- `POST   /api/v1/obras/{idObra}/proveedores/{idProveedor}` â€“ vincular
- `DELETE /api/v1/obras/{idObra}/proveedores/{idProveedor}` â€“ desvincular
- `GET    /api/v1/obras/{idObra}/proveedores` â€“ IDs de proveedores asociados

**Costos**
- `POST   /api/v1/obras/{idObra}/costos`
- `PUT    /api/v1/obras/costos/{id}`
- `DELETE /api/v1/obras/costos/{id}`
- `GET    /api/v1/obras/{idObra}/costos`

**Tareas**
- `POST   /api/v1/obras/{idObra}/tareas`
- `PUT    /api/v1/obras/tareas/{id}`
- `DELETE /api/v1/obras/tareas/{id}`
- `GET    /api/v1/obras/{idObra}/tareas`

**Progreso**
- `GET    /api/v1/obras/{idObra}/progreso` â†’ `{ totalTareas, tareasCompletadas, porcentaje }`

### Clientes / Proveedores / CatÃ¡logos
- `CRUD   /api/v1/clientes/*`
- `CRUD   /api/v1/proveedores/*`
- `GET    /api/v1/tipos-proveedor`
- `GET    /api/v1/catalogos/estados-obra | estados-tarea | estados-pago | tipos-transaccion | tipos-documento`

### Documentos
- `POST   /api/v1/documentos`
- `GET    /api/v1/documentos/obra/{idObra}`
- `DELETE /api/v1/documentos/{id}`

### Transacciones
- `POST   /api/v1/transacciones`
- `GET    /api/v1/transacciones/obra/{idObra}`
- `GET    /api/v1/transacciones/obra/{idObra}/saldo`
- `DELETE /api/v1/transacciones/{id}`

### Reportes (opcional, si materializas read-models)
- `GET    /api/v1/reportes/obra/{id}/resumen-financiero`
- `GET    /api/v1/reportes/obra/{id}/progreso-fisico`
- `GET    /api/v1/reportes/obra/{id}/flujo-caja?desde=YYYY-MM&hasta=YYYY-MM`

## Modelos del frontend y mapeo

- **Cliente / Proveedor / TipoProveedor / EstadoObra / EstadoTarea / TipoTransaccion / TipoDocumento**: CRUDs directos.
- **Obra**: campos adicionales soportados: `beneficio_global`, `beneficio`, `comision`, `tiene_comision`.
- **ObraCosto**: soporta `beneficio` y `id_estado_pago`. `subtotal` y `total` son calculados en backend.
- **Tarea**: se usa `id_estado_tarea` para progreso (el back asume que â€œcompletadaâ€ tiene ID conocido o se configura).
- **Documento**: se guarda `path_archivo` (no binario).
- **Transaccion**: `parcial_o_total` (enum string), `id_factura`/`id_recibo` opcionales.

## Adaptaciones sugeridas en el front
1. **Base URL**: llamar siempre al **Gateway** (`http://localhost:8080`) con los paths listados.
2. **Selects**: poblar combos con `catalogos-obras.obras.obras.service` (o catÃ¡logos locales si preferÃ­s).
3. **ObraCosto**: al crear/editar enviar `cantidad`, `precio_unitario`, `iva`, `beneficio`, `id_estado_pago`; el back devuelve `subtotal` y `total`.
4. **Progreso**: refrescar la tarjeta de avance al **crear/editar/borrar tarea** consultando `GET /api/v1/obras/{idObra}/progreso`.
5. **Documentos**: primero subÃ­s el archivo a una carpeta local del cliente y pasÃ¡s el `path_archivo` al endpoint de metadatos.
6. **Reportes**: para tablero, combinar:
    - `GET /api/v1/obras/{id}/progreso`
    - `GET /api/v1/transacciones/obra/{id}/saldo`
    - `GET /api/v1/obras/{id}/costos`

## Correr local
- Java 17 instalado.
- En cada servicio:
    - `mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.port=808X"`
    - Los `.db` se crean en `./data/`.
- Gateway en `:8080`.

## Notas de diseÃ±o
- **Database-per-obras.obras.obras.service** con **SQLite** â†’ instalaciÃ³n cero para el cliente.
- **Sin acoplar servicios**: no hay llamadas HTTP entre microservicios.
- **DTOs simples** que reflejan tus interfaces TS para que puedas **copiar/pegar**.


