@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Sistema de Gestion de Obras - Inicio (Local)

rem Ir al directorio del script
cd /d "%~dp0"

echo ==================================================
echo  Sistema de Gestion de Obras - Arranque LOCAL
echo  (se construiran las imagenes en este equipo)
echo ==================================================
echo.

rem Verificar Docker CLI
where docker >nul 2>&1
if errorlevel 1 (
  echo [ERROR] No se encontro Docker en este equipo.
  echo         Instala Docker Desktop y vuelve a intentar.
  pause
  exit /b 1
)

rem Verificar que Docker Desktop/daemon este activo
docker info >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker no esta corriendo.
  echo         Abre Docker Desktop y vuelve a ejecutar este script.
  pause
  exit /b 1
)

rem Detectar comando compose (nuevo: "docker compose"; antiguo: "docker-compose")
set "COMPOSE_CMD=docker compose"
%COMPOSE_CMD% version >nul 2>&1
if errorlevel 1 (
  set "COMPOSE_CMD=docker-compose"
)

echo [INFO] Construyendo y levantando servicios BACKEND. Esto puede tardar...
rem Levantar todos los servicios excepto el frontend
%COMPOSE_CMD% -f "docker-compose.yml" up -d --build --remove-orphans ^
  obras-service clientes-service proveedores-service documentos-service ^
  transacciones-service reportes-service api-gateway
if errorlevel 1 (
  echo [ERROR] No se pudo construir/levantar el stack local.
  pause
  exit /b 1
)

echo.
echo [OK] Backend iniciado. Verificando que Obras este listo...

set "OBRAS_CONTAINER=obras_service"
set "READY_MSG=Puerto configurado: 8081"
set "MAX_TRIES=180"
set /a COUNT=0

echo [INFO] Esperando a que Obras informe: "%READY_MSG%"
echo        (esto garantiza que el servicio este listo)

:WAIT_OBRAS
set /a COUNT+=1
docker logs --since 2m %OBRAS_CONTAINER% 2>nul | findstr /C:"%READY_MSG%" >nul
if not errorlevel 1 goto OBRAS_READY

if %COUNT% GEQ %MAX_TRIES% (
  echo [ERROR] No se detecto "%READY_MSG%" en los logs de Obras tras %MAX_TRIES% intentos.
  echo         Revisa los logs con: docker logs %OBRAS_CONTAINER%
  pause
  exit /b 1
)
rem Espera 1 segundo entre intentos
ping -n 2 127.0.0.1 >nul
goto WAIT_OBRAS

:OBRAS_READY
echo [OK] Obras listo. Iniciando Frontend...

%COMPOSE_CMD% -f "docker-compose.yml" up -d --build frontend
if errorlevel 1 (
  echo [ERROR] No se pudo iniciar el Frontend.
  pause
  exit /b 1
)

echo.
echo [OK] Servicios iniciados. Comprobando estado de contenedores...

set "SERVICES=obras_service clientes_service proveedores_service documentos_service transacciones_service reportes_service api_gateway_service obras_frontend"

for %%S in (%SERVICES%) do (
  for /f "usebackq delims=" %%I in (`docker ps -a --filter name=^%%S --format "{{.Status}}"`) do (
    set "STATUS=%%I"
  )
  if not defined STATUS (
    echo   - %%S: NO ENCONTRADO
  ) else (
    echo   - %%S: !STATUS!
  )
  set "STATUS="
)

echo.
echo ================== Puntos de acceso ==================
echo - Frontend (web):   http://localhost:4200
echo - API Gateway:      http://localhost:8080
echo - Obras:            http://localhost:8081
echo - Clientes:         http://localhost:8082
echo - Proveedores:      http://localhost:8083
echo - Reportes:         http://localhost:8084
echo - Transacciones:    http://localhost:8086
echo - Documentos:       http://localhost:8087
echo ======================================================
echo.
echo Para detener todo mas tarde:
echo   %COMPOSE_CMD% -f docker-compose.yml down
echo.
echo Listo. Puedes abrir el navegador y usar la aplicacion.
pause
exit /b 0
