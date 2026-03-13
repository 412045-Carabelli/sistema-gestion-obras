# SGO Workspace Guide

## Proyecto

- Nombre: `sistema-gestion-obras`
- Stack principal:
  - Backend: microservicios Spring Boot
  - Frontend: Angular
  - Base de datos principal actual: SQL Server
  - Storage de archivos: MinIO para `documentos-service`
- Directorios relevantes:
  - Backend: `backend1.0/`
  - Frontend: `frontend1.2/`
  - Inicializacion SQL Server: `db/init/`
  - Compose principal: `docker-compose.yml`

## Arquitectura

- El backend esta separado en microservicios:
  - `obras-service`
  - `clientes-service`
  - `proveedores-service`
  - `documentos-service`
  - `transacciones-service`
  - `reportes-service`
  - `api-gateway`
- Aunque hay microservicios, la estrategia actual de base de datos es:
  - Una base `sgo_dev` para desarrollo local
  - Una base `sgo_prod` para Docker/VPS/produccion
- Cada microservicio usa su propio esquema dentro de esa base compartida:
  - `obras`
  - `clientes`
  - `proveedores`
  - `documentos`
  - `transacciones`
  - `reportes`
- Esta separacion por esquema es obligatoria mientras exista una sola base compartida por ambiente.
- No asumir nunca que todos los servicios pueden usar `dbo`.
- Ya existen nombres de tablas repetidos entre servicios, por ejemplo `auditoria`, por lo que quitar los esquemas rompe el aislamiento.

## Base de Datos

- Script de inicializacion principal: [db/init/create-databases.sql](/C:/Users/User/Desktop/Proyectos/sistema-gestion-obras/db/init/create-databases.sql)
- Ese script debe seguir garantizando:
  - creacion de `sgo_dev`
  - creacion de `sgo_prod`
  - creacion de logins por microservicio
  - creacion de usuarios por base
  - asignacion de esquema por defecto por microservicio
- Si se agrega un microservicio nuevo, actualizar:
  - `db/init/create-databases.sql`
  - `application-dev.properties`
  - `application-prod.properties`
  - `docker-compose.yml`
- Evitar mezclar H2 con SQL Server en perfiles `dev` nuevos.
- La decision vigente es que `dev` tambien usa SQL Server.

## Perfiles y Ejecucion

- Desarrollo desde IDE:
  - usar `SPRING_PROFILES_ACTIVE=dev`
  - los servicios deben apuntar a `sgo_dev`
  - la conexion local usa `localhost:1433`
- Docker/VPS/produccion:
  - usar `SPRING_PROFILES_ACTIVE=prod`
  - los servicios deben apuntar a `sgo_prod`
  - la conexion dentro de Docker usa `sqlserver:1433`
- No volver a introducir configuraciones `dev` con H2 salvo pedido explicito.

## Docker

- Archivo principal: [docker-compose.yml](/C:/Users/User/Desktop/Proyectos/sistema-gestion-obras/docker-compose.yml)
- El `compose` principal representa el despliegue integrado con:
  - SQL Server
  - MinIO
  - backend completo
  - frontend
- El servicio `sqlserver-init` es parte del flujo de arranque porque prepara bases, usuarios y esquemas.
- Si una tarea toca infraestructura, revisar siempre:
  - variables de entorno de `sqlserver`
  - `SPRING_DATASOURCE_URL`
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`
  - dependencias hacia `sqlserver-init`

## Convenciones de Configuracion

- `application-dev.properties`:
  - debe usar SQL Server
  - debe apuntar a `sgo_dev`
  - debe declarar `hibernate.default_schema`
  - debe alinear `app.migration.schema` con el esquema del servicio
- `application-prod.properties`:
  - debe usar SQL Server
  - debe apuntar a `sgo_prod`
  - debe declarar `hibernate.default_schema`
  - debe alinear `app.migration.schema` con el esquema del servicio
- Si se cambia el nombre de un esquema, hay que cambiar tambien la migracion y la configuracion JPA.

## Migraciones y Datos

- Existen archivos `data-dev.sql` y, en algunos servicios, `data-prod.sql`.
- En `prod` no asumir que hay seed de datos automatico.
- Cualquier cambio de tablas debe validar compatibilidad con:
  - Hibernate/JPA
  - migradores `SqliteToSqlServerMigrator`
  - scripts SQL de inicializacion o migracion
- `app.migration.schema` no es decorativo: debe coincidir con el esquema real del servicio.

## Frontend y Gateway

- El frontend consume al `api-gateway`.
- No asumir llamadas directas del frontend a todos los microservicios sin revisar el gateway y environments.
- Si cambia un puerto o URL interna, revisar:
  - configuracion del gateway
  - compose
  - environments del frontend

## Reglas de Trabajo

- Antes de editar configuracion de base de datos, verificar si el cambio afecta:
  - IDE local
  - Docker
  - VPS
  - migracion desde SQLite
- No simplificar eliminando esquemas por microservicio dentro de `sgo_dev` o `sgo_prod`.
- No reemplazar usuarios por `sa` en todos los servicios salvo necesidad explicita.
- No asumir que un cambio en un microservicio no impacta a `reportes-service`; ese servicio agrega informacion de otros.
- Si aparecen cambios no relacionados en el workspace, no revertirlos sin pedido explicito.

## Validaciones Recomendadas

- Ante cambios de infraestructura o datasource, validar al menos:
  - que `docker-compose.yml` siga apuntando a `sgo_prod`
  - que los perfiles `dev` apunten a `sgo_dev`
  - que cada servicio mantenga su `hibernate.default_schema`
  - que `db/init/create-databases.sql` siga siendo idempotente
- Si es posible, levantar:
  - `sqlserver`
  - `sqlserver-init`
  - el microservicio afectado

## Decision Actual a Preservar

- La estrategia vigente del proyecto es:
  - SQL Server como motor unico
  - dos bases por ambiente: `sgo_dev` y `sgo_prod`
  - un esquema por microservicio dentro de cada base
- Si en el futuro se quiere pasar a "una base por microservicio", tratarlo como cambio de arquitectura, no como refactor menor.
