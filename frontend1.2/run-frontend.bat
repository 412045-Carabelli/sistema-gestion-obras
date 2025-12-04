@echo off
setlocal

rem Always run from this folder
cd /d "%~dp0"

rem Load GHCR_TOKEN from .env if present
if exist ".env" (
  for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
    if /i "%%a"=="GHCR_TOKEN" set GHCR_TOKEN=%%b
  )
)

rem Ask interactively if not set
if "%GHCR_TOKEN%"=="" (
  echo Ingrese el token de GHCR con permiso read:packages:
  set /p GHCR_TOKEN=Token: 
)

if "%GHCR_TOKEN%"=="" (
  echo No se proporciono GHCR_TOKEN. Abortando.
  exit /b 1
)

set GHCR_USER=412045-carabelli

echo Haciendo login en GHCR...
docker login ghcr.io -u %GHCR_USER% -p %GHCR_TOKEN% || exit /b 1

echo Descargando imagen...
docker compose -f docker-compose.frontend.yml pull || exit /b 1

echo Levantando contenedores...
docker compose -f docker-compose.frontend.yml up -d || exit /b 1

echo Listo.
