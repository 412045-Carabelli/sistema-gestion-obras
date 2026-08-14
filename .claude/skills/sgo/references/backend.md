# Convenciones backend — Spring Boot 3 / Java 17

Antes de escribir: abrí el archivo equivalente más cercano del mismo servicio y copiá su estilo.
Los servicios no son idénticos entre sí (`transacciones-service` usa `Double` y no separa
interfaz/impl; `obras-service` sí). **Gana el estilo local del servicio que estás tocando.**

## Estructura de paquetes

Referencia: `com.obras`.

```
com.<servicio>
├── <X>ServiceApplication.java   @SpringBootApplication
├── controller/                  @RestController @RequestMapping("/api/<x>")
├── service/                     interfaces
│   └── impl/                    @Service @RequiredArgsConstructor @Transactional
├── repository/                  extends JpaRepository<T, Long>
├── entity/
├── dto/                         Request/Response del servicio
│   └── external/                DTOs de respuestas de OTROS servicios
├── enums/
├── exception/                   excepciones específicas del dominio
├── handler/RestExceptionHandler @RestControllerAdvice
├── client/  o  integration/     clientes HTTP a otros servicios
├── audit/                       AuditLog + AuditLogFilter (ya existe, no lo toques)
├── scheduler/                   @Scheduled
└── config/                      RestTemplateConfig / RestClientConfig / WebClientConfig
```

## Entidades JPA

```java
@Entity
@Table(name = "obras")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Obra { ... }
```

**Nunca `@Data` en entidades** — rompe lazy loading con Hibernate.

Tipos:

| Dato | Tipo Java | Columna SQL Server |
|---|---|---|
| Dinero | `BigDecimal` `precision = 14, scale = 2` | `DECIMAL(14,2)` |
| Fecha de negocio | `LocalDate` / `LocalDateTime` | `DATE` / `DATETIME2` |
| Timestamp de auditoría | `Instant` | `DATETIME2` |
| Booleano | `Boolean` (boxed) con default `Boolean.TRUE` | `BIT` |
| Texto largo | `String` + `columnDefinition = "NVARCHAR(MAX)"` | `NVARCHAR(MAX)` |
| Id | `Long` + `@GeneratedValue(strategy = IDENTITY)` | `BIGINT IDENTITY(1,1)` |

Campos de auditoría estándar, con `@PrePersist` / `@PreUpdate`:
`activo` (soft delete), `creado_en`, `ultima_actualizacion`, `tipo_actualizacion`
(`CREATE`/`UPDATE`/`DELETE`), y `organizacion_id` en toda entidad de negocio.

Algunas entidades llevan además `baja_obra`: distingue "dado de baja porque se dio de baja la
obra" de "dado de baja individualmente" — sirve para mostrar el histórico de obras inactivas.

## DTOs

Request y Response separados. `@Data @NoArgsConstructor @AllArgsConstructor @Builder`, y
`@JsonInclude(NON_NULL)` en los Response. Validación con `jakarta.validation` en los Request.

**Los nombres JSON van en `snake_case`** para coincidir con el frontend:
`id_obra`, `fecha_inicio`, `monto_restante`, `tipo_costo`, `obra_estado`, `beneficio_global`.
Por eso muchos DTOs tienen campos y setters en snake_case (`setId_cliente`, `setFecha_inicio`):
es intencional, seguilo aunque incomode.

`ErrorApi` es el sobre de error uniforme: `message`, `status`, `path`, `timestamp`.

## Services

Interfaz en `service/`, implementación en `service/impl/` con
`@Service @RequiredArgsConstructor @Transactional` y `@Transactional(readOnly = true)` en las
lecturas. Dependencias por constructor (`final` + Lombok), nunca `@Autowired` en campos.

Mapeo entity↔DTO con helpers privados `toDto()` / `toEntity()` en la misma clase.
No hay MapStruct salvo en `documentos-service` (`mapper/DocumentosMapper.java`).

**Anti N+1**: cuando mapees una lista, precalculá en bloque lo que necesites (una query
`findByX_IdIn(ids)` agrupada por id, o un `Map` cacheado de llamadas remotas). Ejemplos:
`ObraServiceImpl.obtenerCostosActivosBulk()`, `TransaccionService.mapearActivasConCacheDeObras()`.

**Strategy para variantes de cálculo**: `service/costo/CostoTipoStrategyFactory` es el patrón a
seguir si aparece otro `switch` sobre un enum de negocio.

## Controllers

```java
@RestController
@RequestMapping("/api/obras")
@RequiredArgsConstructor
public class ObrasController {
  private final ObraService service;

  @GetMapping
  public ResponseEntity<List<ObraDTO>> listar(
      @RequestHeader(value = "X-Organizacion-Id", required = false) Long organizacionId) { ... }
}
```

Devolvé `ResponseEntity`. `@Valid @RequestBody` en las entradas. El `organizacionId` llega por
header y baja hasta el repositorio.

## Excepciones

Excepción propia por dominio (`ObraNotFoundException`, `ClienteNotFoundException`,
`InvalidClienteException`, `ClaveInvalidaException`…) + `RestExceptionHandler` anotado
`@RestControllerAdvice @Order(Ordered.HIGHEST_PRECEDENCE)` que las mapea a `ErrorApi`.
`MethodArgumentNotValidException` → `Map<String,String>` campo→mensaje, HTTP 400.

## Auditoría

`AuditLogFilter` (o `AuditLogWebFilter` en WebFlux) ya existe en cada servicio. Intercepta
POST/PUT/PATCH/DELETE sobre `/api/**`, lee `X-User-Name`, captura la respuesta y escribe en
`auditoria`. **No llames a `auditLogService.save()` desde un service.** Los tests pueden ignorarla.

## Flyway — SQL Server

Archivo: `backend1.0/{servicio}/src/main/resources/db/migration/V{n}__{descripcion}.sql`

Sintaxis obligatoria (T-SQL, **no** PostgreSQL):

```sql
CREATE TABLE obras (
  id BIGINT NOT NULL PRIMARY KEY IDENTITY(1,1),
  nombre NVARCHAR(255) NOT NULL,
  descripcion NVARCHAR(MAX),
  presupuesto DECIMAL(14,2) NOT NULL,
  activo BIT NOT NULL DEFAULT 1,
  organizacion_id BIGINT,
  creado_en DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_obras_estado ON obras(estado_obra);
```

`IDENTITY(1,1)` no `AUTO_INCREMENT` · `BIT` no `BOOLEAN` · `NVARCHAR(MAX)` no `TEXT` ·
`DATETIME2` no `TIMESTAMP` · `DECIMAL(14,2)` para dinero.

Reglas propias de este repo:

1. **Hacé las migraciones idempotentes.** Hubo que arreglar la V34 de transacciones por no
   serlo. Usá `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE ...)`, `CREATE OR ALTER PROCEDURE`,
   `IF OBJECT_ID(...) IS NULL`.
2. **Verificá el número libre antes de crear** (`ls db/migration | sort -V | tail -1`). Ya hubo
   colisiones de versión (V31 en transacciones) por trabajar en ramas paralelas.
3. **Stored procedures: copiá la última versión vigente completa** y modificá sobre esa. Se
   recrean enteros con `CREATE OR ALTER`; si partís de una versión vieja, borrás cambios previos.
   Ojo: la última versión de un SP puede estar en una migración distinta a la última del servicio.
4. Los SPs de deudas son **cross-database**: reciben `@schemaObras`, `@schemaClientes`,
   `@schemaProveedores`, `@schemaTransacciones` y arman SQL dinámico con `QUOTENAME`.

Estado actual de migraciones (a 2026-08-10):

| Servicio | Última |
|---|---|
| obras-service | `V28__drop_redundant_tareas_index.sql` |
| transacciones-service | `V36__permitir_incluir_saldo_cero_cuentas_corrientes.sql` |
| auth-service | `V17__upgrade_organizacion_1_a_enterprise.sql` |
| reportes-service | `V5__excluir_cotizada_de_catalogo_cuenta_corriente.sql` |
| agendas-service | `V5__fix_prioridad_and_organizacion_id.sql` |
| documentos-service | `V3__create_auditoria.sql` |
| proveedores-service | `V3__add_organizacion_id_to_proveedores.sql` |
| clientes-service | `V2__add_organizacion_id_to_clientes.sql` |

## Tests

Service impl con Mockito:

```java
@ExtendWith(MockitoExtension.class)
class ObraServiceImplTest {
  @InjectMocks ObraServiceImpl service;
  @Mock ObraRepository repository;

  @Test
  void crear_obra_exitosamente() {
    when(repository.save(any())).thenReturn(saved);
    ObraDTO res = service.crear(request);
    assertThat(res.getNombre()).isEqualTo("Edificio A");
    verify(repository).save(any(Obra.class));
  }
}
```

Controller BFF: `WebClient.Builder` con `exchangeFunction` stub y
`ReflectionTestUtils.setField(controller, "<x>ServiceUrl", "http://<servicio>:<puerto>")`.

Nombres de test en español con guiones bajos: `obtener_obra_inexistente_lanza_excepcion`.

Comandos:

```bash
mvn -pl obras-service clean compile -q
```

```bash
mvn -pl reportes-service test -q
```
