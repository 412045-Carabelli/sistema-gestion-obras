@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Publicar imagenes SGO en GHCR

rem Ir al directorio del script
cd /d "%~dp0"

echo ==================================================
echo  Publicar imagenes en GitHub Container Registry
echo  (GHCR) para usar docker-compose.ghcr.yml
echo ==================================================
echo.

rem Comprobaciones basicas
where docker >nul 2>&1 || (echo [ERROR] Docker no esta instalado. && pause && exit /b 1)
where mvn >nul 2>&1 || (echo [ERROR] Maven no esta instalado o no esta en PATH. && pause && exit /b 1)
docker info >nul 2>&1 || (echo [ERROR] Docker no esta corriendo. Abre Docker Desktop. && pause && exit /b 1)

set "OWNER="
set "TAG="
set /p OWNER=Organizacion/usuario en GitHub (OWNER): 
set /p TAG=Etiqueta de version (TAG, ej: v1.0.0): 

if not defined OWNER (echo [ERROR] OWNER es obligatorio. && pause && exit /b 1)
if not defined TAG (echo [ERROR] TAG es obligatorio. && pause && exit /b 1)

echo.
echo [INFO] Autenticacion en GHCR (usa tu usuario de GitHub y un PAT con write:packages)
docker login ghcr.io
if errorlevel 1 (
  echo [ERROR] Fallo el login en GHCR.
  pause
  exit /b 1
)

echo.
echo [INFO] Construyendo artefactos backend con Maven (sin tests)...
for /d %%D in (backend1.0\*-service backend1.0\api-gateway) do (
  echo   - Compilando %%D
  pushd "%%D" >nul
  mvn -B -DskipTests package || (echo [ERROR] Fallo Maven en %%D && popd >nul && pause && exit /b 1)
  popd >nul
)

echo.
echo [INFO] Configurando Docker Buildx...
docker buildx ls >nul 2>&1
if errorlevel 1 (
  echo [WARN] No se encontro buildx. Asegurate de tener Docker Desktop actualizado.
)

rem Usar builder por defecto o crear uno temporal si hace falta
docker buildx use default >nul 2>&1 || docker buildx create --name sgo-builder --use >nul 2>&1

echo.
echo [INFO] Construyendo y publicando imagenes en GHCR para tag %TAG% y owner %OWNER%...
docker buildx bake ^
  -f ".github/workflows/ghcr-bake.hcl" ^
  --set *.args.REGISTRY=ghcr.io ^
  --set *.args.OWNER=%OWNER% ^
  --set *.args.TAG=%TAG% ^
  --set *.platform=linux/amd64 ^
  --push

if errorlevel 1 (
  echo [ERROR] Fallo la publicacion de imagenes en GHCR.
  pause
  exit /b 1
)

echo.
echo [OK] Imagenes publicadas correctamente en ghcr.io/%OWNER% con tag %TAG%.
echo.
echo Para levantar el stack usando las imagenes de GHCR:
echo   set GHCR_OWNER=%OWNER%
echo   set TAG=%TAG%
echo   docker compose -f docker-compose.ghcr.yml up -d --pull always --remove-orphans
echo.
echo Tambien puedes crear un release tag en GitHub para que el workflow CI publique automaticamente.
echo (Ahora este repositorio permite ejecutar el workflow manualmente desde la pestaña Actions.)
pause
exit /b 0

