Param(
  [Parameter(Mandatory = $true)][string]$Owner,         # GitHub user u org (namespace en GHCR)
  [Parameter(Mandatory = $true)][string]$Tag,           # Tag de versión, ej: 1.0.0 o latest
  [string]$PatEnvVar = "GHCR_PAT",                     # Nombre de la variable de entorno con el PAT
  [switch]$AlsoTagLatest                                 # Además de $Tag, empujar :latest
)

<#
  Publica todas las imágenes de los microservicios en GHCR.
  Requisitos previos:
  - Docker instalado y en PATH
  - PAT de GitHub con scope: write:packages (y read:packages para probar pulls)
  - Variable de entorno $PatEnvVar con el token (por defecto GHCR_PAT)

  Ejemplo:
  $env:GHCR_PAT = "ghp_xxx..."
  ./tools/publish-ghcr.ps1 -Owner "tu-org-o-usuario" -Tag "1.0.0" -AlsoTagLatest
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Ensure-Docker() {
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker CLI no encontrado. Instálalo y asegúrate de que esté en PATH."
  }
}

function Ensure-LoginGhcr([string]$owner, [string]$patEnv) {
  Write-Host "Autenticando en ghcr.io como '$owner'..." -ForegroundColor Cyan
  $pat = [Environment]::GetEnvironmentVariable($patEnv)
  if ([string]::IsNullOrWhiteSpace($pat)) {
    Write-Warning "Variable de entorno '$patEnv' no establecida. Si ya estás logueado en ghcr.io, puedes ignorar este aviso."
  } else {
    # docker login ghcr.io -u USER -p TOKEN
    docker login ghcr.io -u $owner --password-stdin <<< $pat | Out-Null
  }
}

function Build-And-Push([string]$name, [string]$context) {
  $localImage = "sgo-$name:$Tag"
  $remoteImage = "ghcr.io/$Owner/sgo-$name:$Tag"

  Write-Host "Construyendo $localImage desde $context" -ForegroundColor Yellow
  docker build -t $localImage $context

  Write-Host "Etiquetando $localImage -> $remoteImage" -ForegroundColor Yellow
  docker tag $localImage $remoteImage

  if ($AlsoTagLatest.IsPresent -and $Tag -ne 'latest') {
    $remoteLatest = "ghcr.io/$Owner/sgo-$name:latest"
    docker tag $localImage $remoteLatest
  }

  Write-Host "Pushing $remoteImage" -ForegroundColor Green
  docker push $remoteImage
  if ($AlsoTagLatest.IsPresent -and $Tag -ne 'latest') {
    Write-Host "Pushing ghcr.io/$Owner/sgo-$name:latest" -ForegroundColor Green
    docker push "ghcr.io/$Owner/sgo-$name:latest"
  }
}

Ensure-Docker
Ensure-LoginGhcr -owner $Owner -patEnv $PatEnvVar

# Importante: los servicios Java esperan que exista target/*.jar en cada proyecto.
# Asegúrate de ejecutar 'mvn -q -DskipTests package' en cada servicio si no existen.

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $root "..")
Set-Location $repoRoot

$services = @(
  @{ Name = 'obras-service';         Context = 'backend1.0/obras-service' },
  @{ Name = 'clientes-service';      Context = 'backend1.0/clientes-service' },
  @{ Name = 'proveedores-service';   Context = 'backend1.0/proveedores-service' },
  @{ Name = 'documentos-service';    Context = 'backend1.0/documentos-service' },
  @{ Name = 'transacciones-service'; Context = 'backend1.0/transacciones-service' },
  @{ Name = 'reportes-service';      Context = 'backend1.0/reportes-service' },
  @{ Name = 'api-gateway';           Context = 'backend1.0/api-gateway' },
  @{ Name = 'frontend';              Context = 'frontend1.2' }
)

foreach ($s in $services) {
  Build-And-Push -name $s.Name -context $s.Context
}

Write-Host "Listo. Verifica los paquetes en https://github.com/$Owner?tab=packages" -ForegroundColor Cyan

