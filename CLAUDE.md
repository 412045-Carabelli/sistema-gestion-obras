# CLAUDE.md — SGO Sistema de Gestión de Obras

Instrucciones completas para agentes IA que trabajen en este proyecto. Complementa el `AGENTS.md` con guías técnicas de buenas prácticas.

---

## Para el Agente: Cómo Usar Este Archivo

Este documento **establece los estándares de codificación** que todo agente debe seguir. Antes de escribir código:

1. **Lee el CLAUDE.md** — comprende las convenciones
2. **Lee el archivo existente más cercano** — copia el estilo local exactamente
3. **Implementa** según las reglas aquí documentadas
4. **Verifica tests** — los tests confirman que el patrón está correcto

---

## Estructura del Proyecto (Rutas Reales)

```
sistema-gestion-obras/
├── frontend/                    # ← Angular activo (la fuente de verdad)
│   ├── src/app/
│   │   ├── core/
│   │   ├── features/
│   │   ├── services/
│   │   └── shared/
│   └── package.json (^19.2.0)
│
├── frontend1.2/                 # ← Compilado/desplegado (no editar aquí)
│   └── dist/
│
├── backend1.0/                  # ← Microservicios Java
│   ├── pom.xml
│   ├── api-gateway/
│   ├── obras-service/
│   ├── clientes-service/
│   ├── proveedores-service/
│   ├── reportes-service/
│   ├── transacciones-service/
│   ├── documentos-service/
│   ├── agendas-service/
│   └── common/                  # ← DTOs compartidos
│
├── db/                          # Scripts SQL iniciales
├── docker-compose.yml           # Dev environment
└── AGENTS.md                    # Bitácora de cambios + reglas de reinicio
```

---

## Servicios, Puertos y Conectividad

| Servicio | Puerto | Tipo | Host Docker | Raíz Paquete |
|----------|--------|------|-------------|--------------|
| frontend | 4200 | Angular 19 | `frontend` | N/A |
| api-gateway | 8080 | Spring WebFlux | `api-gateway` | `com.apigateway` |
| obras-service | 8081 | Spring MVC | `obras-service` | `com.obras` |
| clientes-service | 8082 | Spring MVC | `clientes-service` | `com.clientes` |
| proveedores-service | 8083 | Spring MVC | `proveedores-service` | `proveedores` ⚠️ sin `com.` |
| reportes-service | 8084 | Spring MVC | `reportes-service` | `com.reportes` |
| transacciones-service | 8086 | Spring MVC | `transacciones-service` | `com.transacciones` |
| documentos-service | 8087 | Spring WebFlux | `documentos-service` | `com.documentos` |
| agendas-service | 8085/8088 | Spring MVC | `agendas-service` | `com.agendas` |
| SQL Server | 1433 | Database | `sql-server` | N/A |
| MinIO | 9000 | Object Storage | `minio` | N/A |

**Base de datos**: SQL Server 2022 (no PostgreSQL). Una BD por servicio: `sgo_obras`, `sgo_clientes`, etc.

---

## Convenciones Frontend — Angular 19

### Estructura de Carpetas

```
frontend/src/app/
├── app.component.ts              # Root shell (sidebar, header, router-outlet)
├── app.config.ts                 # Configuración standalone (no NgModule)
├── app.routes.ts                 # Rutas (lazy load con loadComponent)
│
├── core/
│   ├── loading-server.interceptor.ts    # HTTP interceptor
│   └── models/
│       └── models.ts                    # TODOS los interfaces/types (archivo único)
│
├── features/
│   ├── {domain}-layout/          # Un layout por dominio (obras, clientes, etc.)
│   │   └── {domain}-layout.component.ts
│   │
│   ├── components/               # Componentes sub-dominio reutilizables
│   │   ├── obra-list/
│   │   ├── obra-movimientos/
│   │   ├── clientes-form/
│   │   └── proveedores-quick-modal/
│   │
│   └── pages/                    # Páginas routed (CRUD pages)
│       ├── dashboard/
│       ├── obras-create/
│       ├── obras-detail/
│       ├── obras-edit/
│       ├── clientes-create/
│       └── ...
│
├── services/
│   ├── obras/
│   │   ├── obras.service.ts              # HTTP only
│   │   └── obras-state.service.ts        # BehaviorSubject state
│   ├── clientes/
│   │   ├── clientes.service.ts
│   │   └── clientes-state.service.ts
│   ├── proveedores/
│   │   ├── proveedores.service.ts
│   │   └── proveedores-state.service.ts
│   ├── tareas/
│   │   └── tareas.service.ts             # Solo HTTP, sin state service
│   └── ...
│
└── shared/
    ├── header/
    ├── sidebar/
    ├── modal/
    ├── pipes/
    └── directives/
```

### Componentes: Sempre Standalone

**Regla**: Todo componente nuevo **DEBE** tener `standalone: true`.

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { YourService } from '../../services/your/your.service';
import { YourModel } from '../../core/models/models';

@Component({
  selector: 'app-your-list',
  templateUrl: './your-list.component.html',
  styleUrls: ['./your-list.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, ToastModule],
  providers: [MessageService]  // Si necesitas MessageService localmente
})
export class YourListComponent implements OnInit, OnDestroy {
  items: YourModel[] = [];
  loading = false;
  private subs = new Subscription();

  constructor(
    private yourService: YourService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.loading = true;
    this.subs.add(
      this.yourService.listar().subscribe({
        next: (data) => {
          this.items = data;
          this.loading = false;
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos' });
          this.loading = false;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
```

### Servicios HTTP

Un servicio HTTP por dominio (ej: `ObrasService`, `ClientesService`).

```typescript
// frontend/src/app/services/obras/obras.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ObraResponse, ObraRequest } from '../../core/models/models';

@Injectable({ providedIn: 'root' })
export class ObrasService {
  private apiUrl = `${environment.apiGateway}${environment.endpoints.obras}`;

  constructor(private http: HttpClient) {}

  listar(): Observable<ObraResponse[]> {
    return this.http.get<ObraResponse[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<ObraResponse> {
    return this.http.get<ObraResponse>(`${this.apiUrl}/${id}`);
  }

  crear(payload: ObraRequest): Observable<ObraResponse> {
    return this.http.post<ObraResponse>(this.apiUrl, payload);
  }

  actualizar(id: number, payload: Partial<ObraRequest>): Observable<ObraResponse> {
    return this.http.put<ObraResponse>(`${this.apiUrl}/${id}`, payload);
  }

  cambiarEstado(id: number, nuevoEstado: string): Observable<ObraResponse> {
    return this.http.patch<ObraResponse>(`${this.apiUrl}/${id}/estado/${nuevoEstado}`, {});
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### Servicios de Estado (BehaviorSubject)

Para datos compartidos entre layout y pages (no todos los dominios necesitan uno).

```typescript
// frontend/src/app/services/obras/obras-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ObraResponse } from '../../core/models/models';

@Injectable({ providedIn: 'root' })
export class ObrasStateService {
  private obraActualSubject = new BehaviorSubject<ObraResponse | null>(null);
  public obraActual$ = this.obraActualSubject.asObservable();

  setObra(obra: ObraResponse): void {
    this.obraActualSubject.next(obra);
  }

  getObra(): ObraResponse | null {
    return this.obraActualSubject.value;
  }

  clearObra(): void {
    this.obraActualSubject.next(null);
  }
}
```

### Carga Paralela de Datos (forkJoin)

Cuando necesitas cargar múltiples recursos en paralelo en `ngOnInit`:

```typescript
ngOnInit(): void {
  this.cargando = true;
  forkJoin({
    obras: this.obrasService.listar(),
    clientes: this.clientesService.listar(),
    saldos: this.reportesService.obtenerSaldos().pipe(
      catchError(() => of([]))  // opcional: fallback para llamadas no críticas
    )
  }).subscribe(({ obras, clientes, saldos }) => {
    this.obras = obras;
    this.clientes = clientes;
    this.saldos = saldos;
    this.cargando = false;
  });
}
```

### Reactive Forms en CRUD

**Componentes de CREATE/EDIT**: Siempre usar Reactive Forms.

```typescript
export class ObrasCreateComponent implements OnInit {
  form!: FormGroup;

  constructor(private fb: FormBuilder, private obrasService: ObrasService) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      presupuesto: [0, [Validators.required, Validators.min(0)]]
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();  // getRawValue(), no .value (incluye disabled)
    this.obrasService.crear(payload).subscribe(() => {
      // success
    });
  }
}
```

Template con validación:
```html
<form [formGroup]="form" (ngSubmit)="guardar()">
  <input formControlName="nombre" />
  <div *ngIf="form.get('nombre')?.invalid && form.get('nombre')?.touched">
    Campo requerido, mín. 3 caracteres
  </div>
</form>
```

### Modelos: Todos en `core/models/models.ts`

**Archivo único** para todos los interfaces y tipos. Ejemplos:

```typescript
// frontend/src/app/core/models/models.ts

export interface ObraResponse {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: string;
  presupuesto: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface ObraRequest {
  nombre: string;
  descripcion?: string;
  presupuesto: number;
  fechaInicio?: string;
}

export interface ClienteResponse {
  id: number;
  nombre: string;
  email?: string;
  telefono?: string;
}

export interface RecordOption {
  label: string;
  name: string;
}

// Report types
export interface DashboardFinancieroResponse {
  totalIngresado: number;
  totalAFacturar: number;
  saldosPendientes: RecordOption[];
}
```

### PrimeNG Componentes (v17+)

Asegúrate de importar el módulo correcto en `imports` del componente:

| Componente | Módulo | Nota |
|-----------|--------|------|
| Tabla | `TableModule` | Atributos: `[value]`, `[columns]`, `[loading]`, `[paginator]` |
| Select | `SelectModule` | ✅ Usar `Select`, NO `Dropdown` (v17+ cambió el nombre) |
| DatePicker | `DatePickerModule` | ✅ Usar `DatePicker`, NO `Calendar` |
| Toast | `ToastModule` | Combina con `MessageService` |
| ConfirmDialog | `ConfirmDialogModule` | Combina con `ConfirmationService` |
| Button | `ButtonModule` | |
| Dropdown (lista anidada) | `DropdownModule` | Para menús, no para selects |
| Card | `CardModule` | |

El `MessageService` ya está proveído globalmente en `app.config.ts`, pero puedes re-proveerlo localmente si necesitas instancias separadas.

### Nomenclatura

| Tipo | Estilo | Ejemplo |
|------|--------|---------|
| Archivos | `kebab-case` | `obras-create.component.ts` |
| Clases | `PascalCase` | `ObrasCreateComponent` |
| Selectores | `app-kebab-case` | `app-obras-list` |
| Métodos | `camelCase` en español | `cargarDetalles()`, `guardarObra()`, `actualizarEstado()` |
| Variables | `camelCase` en español | `obraActual`, `listaPendientes`, `estadosCargados` |
| Templates | mismo nombre que component | `obras-create.component.html` |

---

## Convenciones Backend — Spring Boot 3.3.5 / Java 17

### Estructura de Paquetes por Servicio

Usa como referencia `com.obras` (obras-service). Aplica el mismo patrón a otros servicios:

```
com.obras
├── ObrasApplication.java                 # @SpringBootApplication
├── controller/
│   └── ObrasController.java              # @RestController @RequestMapping("/api/obras")
├── service/
│   ├── ObrasService.java                 # Interface
│   └── impl/
│       └── ObrasServiceImpl.java          # @Service @RequiredArgsConstructor @Transactional
├── repository/
│   └── ObrasRepository.java              # extends JpaRepository<Obra, Long>
├── entity/
│   └── Obra.java                         # @Entity @Table
├── dto/
│   ├── ObraRequest.java                  # DTO entrada
│   ├── ObraResponse.java                 # DTO salida
│   └── ErrorApi.java                     # Error envelope
├── exception/
│   ├── ObraNotFoundException.java
│   └── InvalidObraException.java
├── handler/
│   └── RestExceptionHandler.java         # @RestControllerAdvice
├── audit/
│   ├── AuditLog.java
│   ├── AuditLogRepository.java
│   ├── AuditLogService.java
│   ├── AuditLogController.java
│   ├── AuditLogFilter.java               # OncePerRequestFilter
│   └── AuditLogWebFilter.java            # (si WebFlux)
└── config/
    └── RestClientConfig.java             # Beans de config
```

**Excepción**: `proveedores-service` usa raíz `proveedores` (sin `com.` prefijo).

### Entidades JPA

**Nota**: NO usar `@Data` en entidades (Hibernate issues con lazy loading). Usa:

```java
package com.obras.entity;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "obras")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Obra {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 255)
  private String nombre;

  @Column(columnDefinition = "NVARCHAR(MAX)")
  private String descripcion;

  @Column(nullable = false)
  private String estado;  // PENDIENTE, EN_PROGRESO, FINALIZADA, etc.

  @Column(nullable = false, precision = 14, scale = 2)
  private BigDecimal presupuesto;

  @Column(name = "activo")
  private Boolean activo = Boolean.TRUE;  // Soft-delete

  @Column(name = "creado_en")
  private Instant creadoEn;

  @Column(name = "ultima_actualizacion")
  private Instant ultimaActualizacion;

  @Column(name = "tipo_actualizacion")
  private String tipoActualizacion;  // CREATE, UPDATE, DELETE

  @PrePersist
  protected void onCreate() {
    this.creadoEn = Instant.now();
    marcarAuditoria("CREATE");
  }

  @PreUpdate
  protected void onUpdate() {
    marcarAuditoria("UPDATE");
  }

  private void marcarAuditoria(String tipo) {
    this.ultimaActualizacion = Instant.now();
    this.tipoActualizacion = tipo;
  }
}
```

**Tipos de datos**:
- Dinero: `BigDecimal` con `precision = 14, scale = 2` (SQL: `DECIMAL(14,2)`)
- Fechas de negocio: `LocalDateTime` (ej: `fechaInicio`, `fechaFin`)
- Timestamps de auditoría: `Instant` (ej: `creadoEn`, `ultimaActualizacion`)
- Booleanos: `Boolean` (boxed, no `boolean`) con default `Boolean.TRUE`
- Texto largo: `columnDefinition = "NVARCHAR(MAX)"` (SQL Server)

### DTOs: Split Request/Response (Preferido)

```java
package com.obras.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonInclude;

// Entrada
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ObraRequest {
  @NotBlank(message = "Nombre requerido")
  private String nombre;

  private String descripcion;

  @NotNull(message = "Presupuesto requerido")
  @DecimalMin("0")
  private BigDecimal presupuesto;

  private LocalDateTime fechaInicio;
}

// Salida
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ObraResponse {
  private Long id;
  private String nombre;
  private String descripcion;
  private String estado;
  private BigDecimal presupuesto;
  private LocalDateTime fechaInicio;
  private LocalDateTime fechaFin;
  private Boolean activo;
  private Instant creadoEn;
}

// Error envelope (mismo para todo el servicio)
@Data
public class ErrorApi {
  private String message;
  private int status;
  private String path;
  private Instant timestamp;
}
```

**Naming en DTOs**: Usa `snake_case` en los nombres de JSON fields para coincidir con la API frontend:
```json
{
  "id_obra": 1,
  "nombre": "Edificio A",
  "fecha_inicio": "2025-03-01T00:00:00",
  "presupuesto": 150000.00
}
```

### Service Interface + Implementation

```java
// Interfaz
package com.obras.service;

import com.obras.dto.ObraRequest;
import com.obras.dto.ObraResponse;
import java.util.List;

public interface ObrasService {
  ObraResponse crear(ObraRequest request);
  ObraResponse obtenerPorId(Long id);
  List<ObraResponse> listar();
  ObraResponse actualizar(Long id, ObraRequest request);
  void cambiarEstado(Long id, String nuevoEstado);
  void eliminar(Long id);
}

// Implementación
package com.obras.service.impl;

import com.obras.service.ObrasService;
import com.obras.repository.ObrasRepository;
import com.obras.entity.Obra;
import com.obras.dto.ObraRequest;
import com.obras.dto.ObraResponse;
import com.obras.exception.ObraNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ObrasServiceImpl implements ObrasService {
  private final ObrasRepository repository;

  @Override
  public ObraResponse crear(ObraRequest request) {
    Obra obra = new Obra();
    obra.setNombre(request.getNombre());
    obra.setDescripcion(request.getDescripcion());
    obra.setPresupuesto(request.getPresupuesto());
    obra.setEstado("PENDIENTE");
    obra.setActivo(Boolean.TRUE);

    Obra saved = repository.save(obra);
    return toResponse(saved);
  }

  @Override
  @Transactional(readOnly = true)
  public ObraResponse obtenerPorId(Long id) {
    Obra obra = repository.findById(id)
        .orElseThrow(() -> new ObraNotFoundException("Obra " + id + " no existe"));
    return toResponse(obra);
  }

  @Override
  @Transactional(readOnly = true)
  public List<ObraResponse> listar() {
    return repository.findAll().stream()
        .map(this::toResponse)
        .toList();
  }

  @Override
  public void eliminar(Long id) {
    Obra obra = repository.findById(id)
        .orElseThrow(() -> new ObraNotFoundException("Obra " + id + " no existe"));
    repository.delete(obra);
    log.info("Obra {} eliminada", id);
  }

  // Helpers privados
  private ObraResponse toResponse(Obra obra) {
    return ObraResponse.builder()
        .id(obra.getId())
        .nombre(obra.getNombre())
        .descripcion(obra.getDescripcion())
        .estado(obra.getEstado())
        .presupuesto(obra.getPresupuesto())
        .creadoEn(obra.getCreadoEn())
        .build();
  }
}
```

### Controllers

```java
package com.obras.controller;

import com.obras.service.ObrasService;
import com.obras.dto.ObraRequest;
import com.obras.dto.ObraResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/obras")
@RequiredArgsConstructor
public class ObrasController {
  private final ObrasService service;

  @PostMapping
  public ResponseEntity<ObraResponse> crear(@Valid @RequestBody ObraRequest request) {
    return ResponseEntity.ok(service.crear(request));
  }

  @GetMapping
  public ResponseEntity<List<ObraResponse>> listar() {
    return ResponseEntity.ok(service.listar());
  }

  @GetMapping("/{id}")
  public ResponseEntity<ObraResponse> obtenerPorId(@PathVariable Long id) {
    return ResponseEntity.ok(service.obtenerPorId(id));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ObraResponse> actualizar(
      @PathVariable Long id,
      @Valid @RequestBody ObraRequest request) {
    return ResponseEntity.ok(service.actualizar(id, request));
  }

  @PatchMapping("/{id}/estado/{nuevoEstado}")
  public ResponseEntity<ObraResponse> cambiarEstado(
      @PathVariable Long id,
      @PathVariable String nuevoEstado) {
    service.cambiarEstado(id, nuevoEstado);
    return ResponseEntity.ok(service.obtenerPorId(id));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> eliminar(@PathVariable Long id) {
    service.eliminar(id);
    return ResponseEntity.noContent().build();
  }
}
```

### Exception Handling

```java
package com.obras.exception;

public class ObraNotFoundException extends RuntimeException {
  public ObraNotFoundException(String msg) {
    super(msg);
  }
}

public class InvalidObraException extends RuntimeException {
  public InvalidObraException(String msg) {
    super(msg);
  }
}

// Handler
package com.obras.handler;

import com.obras.dto.ErrorApi;
import com.obras.exception.ObraNotFoundException;
import com.obras.exception.InvalidObraException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class RestExceptionHandler {

  @ExceptionHandler(ObraNotFoundException.class)
  public ResponseEntity<ErrorApi> handleNotFound(
      ObraNotFoundException ex,
      HttpServletRequest request) {
    ErrorApi error = new ErrorApi();
    error.setMessage(ex.getMessage());
    error.setStatus(404);
    error.setPath(request.getRequestURI());
    error.setTimestamp(Instant.now());
    return ResponseEntity.status(404).body(error);
  }

  @ExceptionHandler(InvalidObraException.class)
  public ResponseEntity<ErrorApi> handleInvalidObraException(
      InvalidObraException ex,
      HttpServletRequest request) {
    ErrorApi error = new ErrorApi();
    error.setMessage(ex.getMessage());
    error.setStatus(400);
    error.setPath(request.getRequestURI());
    error.setTimestamp(Instant.now());
    return ResponseEntity.status(400).body(error);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> handleValidation(
      MethodArgumentNotValidException ex) {
    Map<String, String> errors = new HashMap<>();
    ex.getBindingResult().getFieldErrors().forEach(err ->
        errors.put(err.getField(), err.getDefaultMessage())
    );
    return ResponseEntity.badRequest().body(errors);
  }

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<ErrorApi> handleGeneric(
      RuntimeException ex,
      HttpServletRequest request) {
    log.error("Error interno", ex);
    ErrorApi error = new ErrorApi();
    error.setMessage("Error interno del servidor");
    error.setStatus(500);
    error.setPath(request.getRequestURI());
    error.setTimestamp(Instant.now());
    return ResponseEntity.status(500).body(error);
  }
}
```

### Audit Log — Automático por Filter

**NO llames `auditLogService.save()` en el service impl**. El filtro lo hace automáticamente.

El `AuditLogFilter` (que ya existe en todos los servicios):
- Intercepta todos los POST/PUT/PATCH/DELETE en `/api/**`
- Lee el header `X-User-Name` para la identidad del usuario
- Captura el cuerpo de la respuesta
- Lo guarda en la tabla `auditoria` automáticamente

Nada que hacer: simplemente que exista el filtro. Los tests pueden ignorar el audit.

### Flyway Migrations (SQL Server)

**Archivo**: `backend1.0/{servicio}/src/main/resources/db/migration/V{n}__{description}.sql`

Ejemplos de nombres:
- `V1__create_obras_table.sql`
- `V2__add_presupuesto_column.sql`
- `V3__create_index_on_estado.sql`

**SQL Server syntax** (no PostgreSQL):

```sql
-- V1__create_obras_table.sql
CREATE TABLE obras (
  id BIGINT NOT NULL PRIMARY KEY IDENTITY(1,1),
  nombre NVARCHAR(255) NOT NULL,
  descripcion NVARCHAR(MAX),
  estado NVARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
  presupuesto DECIMAL(14,2) NOT NULL,
  activo BIT NOT NULL DEFAULT 1,
  creado_en DATETIME2 NOT NULL DEFAULT GETDATE(),
  ultima_actualizacion DATETIME2,
  tipo_actualizacion NVARCHAR(50)
);

CREATE INDEX idx_obras_estado ON obras(estado);
```

**Reglas**:
- `IDENTITY(1,1)` para auto-increment (no `AUTO_INCREMENT`)
- `BIT` para booleanos (no `BOOLEAN`)
- `NVARCHAR(MAX)` para strings largos (no `TEXT`)
- `DATETIME2` para timestamps (no `TIMESTAMP`)
- `DECIMAL(14,2)` para dinero
- `ddl-auto=none` siempre (Hibernate NUNCA maneja el esquema)

---

## Testing Patterns

### Service Implementation Tests

```java
@ExtendWith(MockitoExtension.class)
class ObrasServiceImplTest {
  @InjectMocks
  ObrasServiceImpl service;

  @Mock
  ObrasRepository repository;

  @Test
  void crear_obra_exitosamente() {
    // Given
    ObraRequest request = new ObraRequest();
    request.setNombre("Edificio A");
    request.setPresupuesto(new BigDecimal("100000"));

    Obra savedObra = new Obra();
    savedObra.setId(1L);
    savedObra.setNombre("Edificio A");
    savedObra.setEstado("PENDIENTE");

    when(repository.save(any())).thenReturn(savedObra);

    // When
    ObraResponse response = service.crear(request);

    // Then
    assertThat(response).isNotNull();
    assertThat(response.getNombre()).isEqualTo("Edificio A");
    verify(repository).save(any(Obra.class));
  }

  @Test
  void obtener_obra_inexistente_lanza_excepcion() {
    // Given
    when(repository.findById(999L)).thenReturn(Optional.empty());

    // When / Then
    assertThatThrownBy(() -> service.obtenerPorId(999L))
        .isInstanceOf(ObraNotFoundException.class)
        .hasMessageContaining("Obra 999 no existe");
  }
}
```

### BFF Controller Tests

```java
class ObrasBffControllerTest {
  private ObrasBffController controller;
  private WebClient.Builder builder;

  @BeforeEach
  void setup() {
    builder = WebClient.builder()
        .exchangeFunction(stubExchange());

    controller = new ObrasBffController(builder);
    ReflectionTestUtils.setField(controller, "obrasServiceUrl", "http://obras-service:8081");
  }

  @Test
  void listar_obras_exitosamente() {
    // Given
    String json = "[{\"id\":1,\"nombre\":\"Obra A\"}]";
    this.builder.exchangeFunction(req -> Mono.just(createResponse(200, json)));

    // When
    var response = controller.listar().blockOptional();

    // Then
    assertThat(response).isPresent();
  }

  private StubExchangeFunction stubExchange() {
    return (req) -> Mono.just(
        ClientResponse.create(200)
            .header("Content-Type", "application/json")
            .body("[]")
            .build()
    );
  }
}
```

---

## Google Sheets Task Tracking

**Sheet ID**: `1JvFOLkCvdA39OH9HdCFps1-jlrX19GEXgD7TTD9ifRw`

**Tab**: `FIXES`

**Columnas**:
- `ID` — identificador único
- `MÓDULO` — obras, clientes, proveedores, etc.
- `DESCRIPCIÓN` — qué hay que resolver
- `PASOS A REPRODUCIR` — (opcional) si es bug
- `ESTADO` — PENDIENTE / EN_PROGRESO / RESUELTO / DESCARTADO
- `OBSERVACIONES INTERNAS` — notas técnicas
- `FECHA IDENTIFICADO` — date
- `FECHA RESUELTO` — date
- `PRIORIDAD` — ALTA / MEDIA / BAJA

---

## Obsidian Vault Integration

**Raíz del vault**: `C:\Users\Usuario\Desktop\my-work\`

**Carpeta de tareas resueltas**: `Sistema de Gestión de Obras\Tareas Resueltas\`

**Formato**: `{ID} - {Título}.md`

Ej: `SGO-001 - Corregir visualización de estados en proveedores.md`

---

## Reglas de Reinicio (desde AGENTS.md)

Cuando haces cambios, reinicia:

| Tipo de cambio | Servicios a reiniciar |
|---|---|
| Solo Angular frontend | `frontend1.2` (o recargar navegador) |
| Un microservicio backend | Ese servicio específico |
| Cambio de contrato (frontend consume) | Microservicio + `api-gateway` + recargar frontend |
| Facturación transversal | `transacciones-service`, `obras-service`, `api-gateway` |
| Reportes | `reportes-service`, `api-gateway` |
| Documentos/Notas | `documentos-service`, `api-gateway` |

---

## Resumen Checklist para el Agente

Antes de commitar:

- [ ] Leí el archivo existente más cercano y copié el estilo
- [ ] Componentes Angular: `standalone: true`, explicit imports
- [ ] Servicios: HTTP y State separados (si aplica)
- [ ] Models: todos en `core/models/models.ts`
- [ ] Entidades: `@Getter @Setter @Builder` (no `@Data`)
- [ ] DTOs: split Request/Response, `@JsonInclude(NON_NULL)` en Response
- [ ] Exception: entity-specific exceptions, `ErrorApi` response
- [ ] Flyway: SQL Server syntax, IDENTITY/BIT/NVARCHAR(MAX)/DATETIME2
- [ ] Tests: service impl con Mockito, controller con StubExchangeFunction
- [ ] Naming: archivos kebab-case, clases PascalCase, métodos camelCase español
- [ ] Reinicio: identifiqué qué servicios reiniciar (según tabla arriba)
