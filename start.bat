@echo off
title Sistema de Gestion de Obras

echo.
echo  =========================================
echo   Sistema de Gestion de Obras
echo  =========================================
echo.
echo  Iniciando sistema, por favor espere...
echo.

docker compose -f docker-compose.ghcr.yml up -d

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] No se pudo iniciar el sistema.
    echo  Asegurese de que Docker Desktop este abierto y vuelva a intentarlo.
    echo.
    pause
    exit /b 1
)

echo.
echo  =========================================
echo   Sistema iniciado correctamente.
echo   Abra su navegador en: http://localhost:4200
echo  =========================================
echo.
pause
