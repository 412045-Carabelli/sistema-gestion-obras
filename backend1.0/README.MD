# Backend Microservicios – Gestión de Obras (Spring Boot + SQLite)

## Módulos
- **api-gateway**: enrutamiento (no agrega lógica).
- **clientes-obras.obras.obras.service**: CRUD de clientes.
- **proveedores-obras.obras.obras.service**: CRUD de proveedores y tipos de proveedor.
- **catalogos-obras.obras.obras.service**: catálogos para selects (estados, tipos).
- **obras-obras.obras.obras.service**: núcleo de obras, costos, tareas, relación obra–proveedor, progreso.
- **documentos-obras.obras.obras.service**: documentos vinculados a obra (ruta en disco).
- **transacciones-obras.obras.obras.service**: flujo de caja (cobros/pagos).
- **reportes-obras.obras.obras.service**: endpoints de reporte por contexto (opcional).

Cada servicio usa **SQLite** con archivo propio `./data/<servicio>.db` y **no llama a otros servicios** (independencia total).

## Endpoints clave que el front debe usar

### Obras
- `POST   /api/obras` – crear
- `GET    /api/obras?page=&size=` – listar
- `GET    /api/obras/{id}` – detalle
- `PUT    /api/obras/{id}` – actualizar
- `PATCH  /api/obras/{id}/estado/{idEstado}` – cambiar estado
- `PATCH  /api/obras/{id}/activo?value=true|false` – activar/desactivar

**Relación Obra–Proveedor**
- `POST   /api/obras/{idObra}/proveedores/{idProveedor}` – vincular
- `DELETE /api/obras/{idObra}/proveedores/{idProveedor}` – desvincular
- `GET    /api/obras/{idObra}/proveedores` – IDs de proveedores asociados

**Costos**
- `POST   /api/obras/{idObra}/costos`
- `PUT    /api/obras/costos/{id}`
- `DELETE /api/obras/costos/{id}`
- `GET    /api/obras/{idObra}/costos`

**Tareas**
- `POST   /api/obras/{idObra}/tareas`
- `PUT    /api/obras/tareas/{id}`
- `DELETE /api/obras/tareas/{id}`
- `GET    /api/obras/{idObra}/tareas`

**Progreso**
- `GET    /api/obras/{idObra}/progreso` → `{ totalTareas, tareasCompletadas, porcentaje }`

### Clientes / Proveedores / Catálogos
- `CRUD   /api/clientes/*`
- `CRUD   /api/proveedores/*`
- `GET    /api/tipos-proveedor`
- `GET    /api/catalogos/estados-obra | estados-tarea | estados-pago | tipos-transaccion | tipos-documento`

### Documentos
- `POST   /api/documentos`
- `GET    /api/documentos/obra/{idObra}`
- `DELETE /api/documentos/{id}`

### Transacciones
- `POST   /api/transacciones`
- `GET    /api/transacciones/obra/{idObra}`
- `GET    /api/transacciones/obra/{idObra}/saldo`
- `DELETE /api/transacciones/{id}`

### Reportes (opcional, si materializas read-models)
- `GET    /api/reportes/obra/{id}/resumen-financiero`
- `GET    /api/reportes/obra/{id}/progreso-fisico`
- `GET    /api/reportes/obra/{id}/flujo-caja?desde=YYYY-MM&hasta=YYYY-MM`

## Modelos del frontend y mapeo

- **Cliente / Proveedor / TipoProveedor / EstadoObra / EstadoTarea / TipoTransaccion / TipoDocumento**: CRUDs directos.
- **Obra**: campos adicionales soportados: `beneficio_global`, `beneficio`, `comision`, `tiene_comision`.
- **ObraCosto**: soporta `beneficio` y `id_estado_pago`. `subtotal` y `total` son calculados en backend.
- **Tarea**: se usa `id_estado_tarea` para progreso (el back asume que “completada” tiene ID conocido o se configura).
- **Documento**: se guarda `path_archivo` (no binario).
- **Transaccion**: `parcial_o_total` (enum string), `id_factura`/`id_recibo` opcionales.

## Adaptaciones sugeridas en el front
1. **Base URL**: llamar siempre al **Gateway** (`http://localhost:8080`) con los paths listados.
2. **Selects**: poblar combos con `catalogos-obras.obras.obras.service` (o catálogos locales si preferís).
3. **ObraCosto**: al crear/editar enviar `cantidad`, `precio_unitario`, `iva`, `beneficio`, `id_estado_pago`; el back devuelve `subtotal` y `total`.
4. **Progreso**: refrescar la tarjeta de avance al **crear/editar/borrar tarea** consultando `GET /api/obras/{idObra}/progreso`.
5. **Documentos**: primero subís el archivo a una carpeta local del cliente y pasás el `path_archivo` al endpoint de metadatos.
6. **Reportes**: para tablero, combinar:
    - `GET /api/obras/{id}/progreso`
    - `GET /api/transacciones/obra/{id}/saldo`
    - `GET /api/obras/{id}/costos`

## Correr local
- Java 17 instalado.
- En cada servicio:
    - `mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.port=808X"`
    - Los `.db` se crean en `./data/`.
- Gateway en `:8080`.

## Notas de diseño
- **Database-per-obras.obras.obras.service** con **SQLite** → instalación cero para el cliente.
- **Sin acoplar servicios**: no hay llamadas HTTP entre microservicios.
- **DTOs simples** que reflejan tus interfaces TS para que puedas **copiar/pegar**.

