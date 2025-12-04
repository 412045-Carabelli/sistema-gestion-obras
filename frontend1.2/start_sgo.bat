@echo off
setlocal

rem Run from this folder
cd /d "%~dp0"

echo Descargando las imagenes...
docker compose pull || exit /b 1

echo Levantando contenedores...
docker compose up -d || exit /b 1

echo Listo. El frontend deberia estar disponible.
