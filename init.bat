@ECHO OFF
TITLE Gestor de Obras - Lanzador de Sistema
COLOR 0A

ECHO.
ECHO  ======================================================
ECHO      Iniciando el Sistema de Gestion de Obras...
ECHO  ======================================================
ECHO.

REM ----------------------------------------------------------
REM [1/6] Verificar que Docker esté en ejecución
REM ----------------------------------------------------------
ECHO  [1/6] Verificando que Docker este en ejecucion...
docker --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    ECHO.
    ECHO  ❌ ERROR: Docker no se encuentra o no esta iniciado.
    ECHO  Por favor, instala y ejecuta Docker Desktop antes de correr este script.
    ECHO.
    PAUSE
    EXIT /B
)
ECHO  ✅ Docker detectado correctamente.
ECHO.

REM ----------------------------------------------------------
REM [2/6] Crear carpetas 'data' si no existen
REM ----------------------------------------------------------
ECHO  [2/6] Verificando carpetas de base de datos...
SET BASE_PATH=backend1.0

FOR %%S IN (obras-service clientes-service proveedores-service transacciones-service documentos-service reportes-service) DO (
    IF NOT EXIST "%BASE_PATH%\%%S\data" (
        ECHO    ➕ Creando carpeta: %BASE_PATH%\%%S\data
        mkdir "%BASE_PATH%\%%S\data"
    ) ELSE (
        ECHO    ✅ Carpeta ya existe: %BASE_PATH%\%%S\data
    )
)
ECHO.

REM ----------------------------------------------------------
REM [3/6] Apagar contenedores anteriores
REM ----------------------------------------------------------
ECHO  [3/6] Deteniendo contenedores anteriores...
docker compose down
ECHO  ✅ Contenedores detenidos.
ECHO.

REM ----------------------------------------------------------
REM [4/6] Construir y levantar los servicios
REM ----------------------------------------------------------
ECHO  [4/6] Construyendo y levantando los servicios...
ECHO  (Esto puede tardar algunos minutos la primera vez)
docker compose up -d --build
IF %ERRORLEVEL% NEQ 0 (
    ECHO.
    ECHO  ❌ Ocurrió un error al levantar los servicios.
    ECHO  Revisa la salida de Docker para más detalles.
    PAUSE
    EXIT /B
)
ECHO  ✅ Servicios en proceso de inicio.
ECHO.

REM ----------------------------------------------------------
REM [5/6] Esperar para que los servicios se estabilicen
REM ----------------------------------------------------------
ECHO  [5/6] Esperando 20 segundos para que los servicios se estabilicen...
TIMEOUT /T 20 /NOBREAK >nul
ECHO.

REM ----------------------------------------------------------
REM [6/6] Abrir la aplicación en el navegador
REM ----------------------------------------------------------
ECHO  [6/6] Abriendo la aplicacion en tu navegador web...
start http://localhost:4200

ECHO.
ECHO  ======================================================
ECHO    ✅ ¡SISTEMA INICIADO CON EXITO!
ECHO.
ECHO    Puedes cerrar esta ventana. Los servicios
ECHO    seguiran corriendo en segundo plano.
ECHO  ======================================================
ECHO.
PAUSE
