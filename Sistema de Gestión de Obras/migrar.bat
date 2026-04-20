@echo off
setlocal
title SGO - Migracion de datos

cd /d "%~dp0"

rem Aceptar tag como primer argumento, por defecto "latest"
if "%~1"=="" (
  set "TAG=latest"
) else (
  set "TAG=%~1"
)

echo ==================================================
echo  Migracion de datos historicos
echo  SQLite (.db) -^> SQL Server
echo  Archivos de documentos -^> volumen MinIO
echo  Ejecutar SOLO la primera vez.
echo ==================================================
echo.

if not exist "data\obras.db" (
  echo [ERROR] No se encontro data\obras.db
  echo         Copia todos los archivos .db a la carpeta data\ y vuelve a ejecutar.
  pause
  exit /b 1
)
if not exist "data\clientes.db" (
  echo [ERROR] No se encontro data\clientes.db
  pause
  exit /b 1
)
if not exist "data\proveedores.db" (
  echo [ERROR] No se encontro data\proveedores.db
  pause
  exit /b 1
)
if not exist "data\documentos.db" (
  echo [ERROR] No se encontro data\documentos.db
  pause
  exit /b 1
)
if not exist "data\transacciones.db" (
  echo [ERROR] No se encontro data\transacciones.db
  pause
  exit /b 1
)
if not exist "data\reportes.db" (
  echo [ERROR] No se encontro data\reportes.db
  pause
  exit /b 1
)

if not exist "minio-data\" (
  echo [ERROR] No se encontro la carpeta minio-data\
  echo         Copia tu backup de MinIO a minio-data\ y vuelve a ejecutar.
  pause
  exit /b 1
)

where docker >nul 2>&1
if errorlevel 1 (
  echo [ERROR] No se encontro Docker. Instala Docker Desktop.
  pause
  exit /b 1
)
docker info >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker no esta corriendo. Abre Docker Desktop primero.
  pause
  exit /b 1
)

set "COMPOSE_CMD=docker compose"
%COMPOSE_CMD% version >nul 2>&1
if errorlevel 1 set "COMPOSE_CMD=docker-compose"

echo [1/4] Descargando imagenes...
%COMPOSE_CMD% --project-name sgo -f docker-compose.yml pull
echo.

echo [2/4] Copiando archivos de MinIO al volumen Docker...
docker run --rm -v "%CD%\minio-data:/source:ro" -v "sgo_minio_data:/dest" alpine sh -c "cp -r /source/. /dest/ && echo OK: Archivos copiados al volumen."
if errorlevel 1 (
  echo [ERROR] Fallo la copia de archivos de MinIO.
  pause
  exit /b 1
)
echo.

echo [3/4] Levantando servicios con migracion SQLite activada (tag: %TAG%)...
set APP_MIGRATION_ENABLED=true
%COMPOSE_CMD% --project-name sgo -f docker-compose.yml up -d
if errorlevel 1 (
  echo [ERROR] Fallo al levantar los contenedores.
  pause
  exit /b 1
)

echo.
echo [4/4] Migracion en progreso...
echo       Los serviciosestan importando los datos de SQLite a SQL Server.
echo       Esto puede tardar 1-2 minutos.
echo       Los archivos de MinIO ya fueron copiados al volumen (paso 2).
echo.
echo       Para ver el progreso:
echo         %COMPOSE_CMD% --project-name sgo -f docker-compose.yml logs -f obras-service
echo.
echo Cuando todo este bien, usa start.bat para los arranques normales.
echo Podes borrar las carpetas data\ y minio-data\ cuando quieras.
echo.
pause
exit /b 0
