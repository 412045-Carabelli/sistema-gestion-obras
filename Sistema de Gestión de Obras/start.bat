@echo off
setlocal
title Sistema de Gestion de Obras - Inicio (GHCR)

rem Ir al directorio del script
cd /d "%~dp0"

echo ==================================================
echo  Sistema de Gestion de Obras - Arranque desde GHCR
echo  (descarga imagenes publicas y levanta contenedores)
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

echo Descargando imagenes publicas de GHCR...
%COMPOSE_CMD% -f "docker-compose.yml" pull || exit /b 1

echo Levantando contenedores...
%COMPOSE_CMD% -f "docker-compose.yml" up -d || exit /b 1

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
