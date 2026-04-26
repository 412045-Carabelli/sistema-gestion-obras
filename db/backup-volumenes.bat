@echo off
REM Script para hacer backup de volúmenes Docker
REM Uso: backup-volumenes.bat [nombre-volumen] (opcional)

setlocal enabledelayedexpansion
chcp 65001 >nul

REM Crear carpeta de backups si no existe
set "BACKUP_DIR=%cd%\backups"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Crear carpeta con timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set "BACKUP_FOLDER=%BACKUP_DIR%\backup_%mydate%_%mytime%"
mkdir "%BACKUP_FOLDER%"

echo.
echo =========================================
echo  Backup de Volúmenes Docker
echo =========================================
echo Carpeta de destino: %BACKUP_FOLDER%
echo.

REM Si se proporciona un volumen específico
if not "%1"=="" (
    set "VOLUMEN=%1"
    call :backup_volumen "!VOLUMEN!"
    goto :end
)

REM Si no, hacer backup de todos los volúmenes
echo Obteniendo lista de volúmenes...
echo.

for /f "skip=1 tokens=1" %%V in ('docker volume ls --quiet') do (
    call :backup_volumen "%%V"
)

:end
echo.
echo =========================================
echo  ¡Backup completado!
echo  Ubicación: %BACKUP_FOLDER%
echo =========================================
pause
exit /b

:backup_volumen
setlocal enabledelayedexpansion
set "VOLUMEN=%~1"
echo [*] Procesando volumen: %VOLUMEN%...

REM Verificar que el volumen existe
docker volume inspect "%VOLUMEN%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] El volumen "%VOLUMEN%" no existe
    exit /b
)

REM Crear nombre del archivo con timestamp
set "ARCHIVO=%BACKUP_FOLDER%\%VOLUMEN%.tar.gz"

REM Hacer backup
docker run --rm -v "%VOLUMEN%":/datos -v "%BACKUP_FOLDER%":/backup ^
    alpine tar czf /backup/%VOLUMEN%.tar.gz /datos

if errorlevel 1 (
    echo [ERROR] Fallo al hacer backup de %VOLUMEN%
) else (
    REM Obtener tamaño del archivo
    for %%F in ("%ARCHIVO%") do set "SIZE=%%~zF"
    echo [OK] Backup creado: %VOLUMEN%.tar.gz (!SIZE! bytes)
)
echo.
endlocal
exit /b
