# Migracion de Pablo: SQLite Docker a SQL Server

## Objetivo

Migrar el entorno Docker de Pablo desde los archivos SQLite legacy hacia SQL Server, conservando respaldo completo previo y usando los `SqliteToSqlServerMigrator` ya incluidos en los microservicios.

## Archivos para usar

- Compose de migracion: [docker-compose.migration.yml](/C:/Users/Usuario/Desktop/my-work/sistema-gestion-obras/docker-compose.migration.yml)
- Script de backup de volumenes: [backup-docker-volumes.ps1](/C:/Users/Usuario/Desktop/my-work/sistema-gestion-obras/tools/migration/backup-docker-volumes.ps1)
- Init SQL Server: [create-databases.sql](/C:/Users/Usuario/Desktop/my-work/sistema-gestion-obras/db/init/create-databases.sql)

## Precondiciones

- Tener Docker Desktop funcionando.
- Tener los `.db` SQLite disponibles o poder extraerlos de los volumenes viejos.
- Tener definido `MSSQL_SA_PASSWORD` en `.env`.
- Ejecutar todo con el stack original apagado.

## Respaldo previo

1. Apagar el stack actual.
```powershell
docker compose down
```

2. Ejecutar backup de volumenes.
```powershell
powershell -ExecutionPolicy Bypass -File .\tools\migration\backup-docker-volumes.ps1 -OutputDir .\migration-backups -IncludeSqlServer
```

3. Verificar que existan los `.tar.gz` en `.\migration-backups`.

## Preparacion de SQLite legacy

Los migradores leen SQLite desde `./data` montado como `/app/legacy`.

Los nombres esperados son:

- `data/obras.db`
- `data/clientes.db`
- `data/proveedores.db`
- `data/transacciones.db`
- `data/reportes.db`
- `data/documentos-dev.db`

Si hoy esos `.db` viven dentro de volumenes Docker, extraerlos antes de migrar.

Ejemplos:
```powershell
docker run --rm -v obras_data:/from -v ${PWD}\data:/to alpine sh -c "cp /from/*.db /to/obras.db"
docker run --rm -v clientes_data:/from -v ${PWD}\data:/to alpine sh -c "cp /from/*.db /to/clientes.db"
docker run --rm -v proveedores_data:/from -v ${PWD}\data:/to alpine sh -c "cp /from/*.db /to/proveedores.db"
docker run --rm -v transacciones_data:/from -v ${PWD}\data:/to alpine sh -c "cp /from/*.db /to/transacciones.db"
docker run --rm -v reportes_data:/from -v ${PWD}\data:/to alpine sh -c "cp /from/*.db /to/reportes.db"
docker run --rm -v documentos_data:/from -v ${PWD}\data:/to alpine sh -c "cp /from/*.db /to/documentos-dev.db"
```

## Arranque de migracion

1. Levantar infraestructura base.
```powershell
docker compose -f .\docker-compose.migration.yml up -d sqlserver sqlserver-init minio
```

2. Esperar a que `sqlserver-init` termine bien.
```powershell
docker compose -f .\docker-compose.migration.yml logs -f sqlserver-init
```

3. Levantar los microservicios de datos.
```powershell
docker compose -f .\docker-compose.migration.yml up -d obras-service clientes-service proveedores-service documentos-service transacciones-service reportes-service backup-service
```

4. Revisar logs de migracion.
```powershell
docker compose -f .\docker-compose.migration.yml logs -f obras-service clientes-service proveedores-service documentos-service transacciones-service reportes-service
```

Buscar mensajes como:

- `SQLite migration enabled`
- `SQLite migration completed`
- `SQLite migration already completed`

5. Cuando la migracion termine, levantar gateway y frontend.
```powershell
docker compose -f .\docker-compose.migration.yml up -d api-gateway frontend
```

## Validaciones

- Entrar a la UI y verificar datos de clientes, proveedores, obras, transacciones y documentos.
- Verificar que SQL Server tenga datos en `sgo_prod`.
- Verificar que `backups.backup_job` y `backups.backup_schedule` existan en `sgo_prod`.

Ejemplo rapido:
```powershell
docker exec -it sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "<TU_PASSWORD>" -Q "SELECT DB_NAME(), (SELECT COUNT(*) FROM sgo_prod.clientes.clientes)"
```

## Cierre post-migracion

Una vez validado todo, desactivar la migracion automatica para futuros reinicios.

Opciones:

- exportar `APP_MIGRATION_ENABLED=false`
- o editar el compose de produccion definitivo para dejarlo en `false`

## Advertencias

- Este compose de migracion apunta todo a `sgo_prod`.
- No mezclar durante la migracion servicios apuntando a `sgo_dev` y otros a `sgo_prod`.
- No reencender el stack SQLite viejo después de migrar, porque volverias a divergir datos.
- En `documentos-service`, la base migra metadatos; los archivos deben seguir respaldados en `documentos_uploads` y `minio_data`.
