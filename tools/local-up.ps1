Param(
  [switch]$NoClean,            # No borrar bases SQLite locales
  [switch]$NoBuild,            # No reconstruir imágenes Docker
  [switch]$BackendOnly         # Usar compose solo backend
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Ensure-Bin($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "$name no encontrado en PATH"
  }
}

function Build-Maven() {
  Write-Host "Compilando JARs (skip tests)..." -ForegroundColor Cyan
  $projects = @(
    "backend1.0/obras-service/pom.xml",
    "backend1.0/clientes-service/pom.xml",
    "backend1.0/proveedores-service/pom.xml",
    "backend1.0/documentos-service/pom.xml",
    "backend1.0/transacciones-service/pom.xml",
    "backend1.0/reportes-service/pom.xml",
    "backend1.0/api-gateway/pom.xml"
  )
  foreach ($p in $projects) { mvn -B -DskipTests -f $p package }
}

function Clean-LocalDbs() {
  Write-Host "Eliminando bases SQLite locales para seed limpio..." -ForegroundColor Yellow
  $paths = @(
    'backend1.0/obras-service/data/*.db',
    'backend1.0/proveedores-service/data/*.db',
    'backend1.0/documentos-service/data/*.db',
    'backend1.0/transacciones-service/data/*.db'
  )
  foreach ($p in $paths) { Remove-Item -Force $p -ErrorAction SilentlyContinue }
}

function Compose-Up($backendOnly) {
  if ($backendOnly) {
    docker compose -f backend1.0/docker-compose.backend.yml down
    docker compose -f backend1.0/docker-compose.backend.yml build --no-cache
    docker compose -f backend1.0/docker-compose.backend.yml up -d
  } else {
    docker compose down
    if (-not $NoBuild) { docker compose build --no-cache }
    docker compose up -d
  }
}

Ensure-Bin docker
Ensure-Bin mvn

if (-not $NoClean) { Clean-LocalDbs }
Build-Maven
Compose-Up -backendOnly:$BackendOnly.IsPresent

Write-Host "Listo. Revisa logs con: docker compose logs -f api-gateway" -ForegroundColor Green

