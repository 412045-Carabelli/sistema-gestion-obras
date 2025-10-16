@ECHO OFF
TITLE Gestor de Obras - Detener Sistema
COLOR 0C

ECHO.
ECHO  ======================================================
ECHO      Deteniendo todos los servicios del sistema...
ECHO  ======================================================
ECHO.

docker-compose down

ECHO.
ECHO  ======================================================
ECHO    ¡Servicios detenidos correctamente!
ECHO  ======================================================
ECHO.
PAUSE