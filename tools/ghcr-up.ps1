Param(
  [string]$EnvFile = ".env",
  [switch]$Login,
  [string]$User,
  [string]$TokenEnv = "GHCR_PAT"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Ensure-Bin($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) { throw "$name no encontrado en PATH" }
}

Ensure-Bin docker

if ($Login) {
  $tok = [Environment]::GetEnvironmentVariable($TokenEnv)
  if ([string]::IsNullOrWhiteSpace($tok)) { throw "Variable de entorno $TokenEnv vacía" }
  Write-Host "Haciendo login en ghcr.io como $User" -ForegroundColor Cyan
  docker login ghcr.io -u $User --password-stdin <<< $tok | Out-Null
}

docker compose -f docker-compose.ghcr.yml --env-file $EnvFile pull
docker compose -f docker-compose.ghcr.yml --env-file $EnvFile down -v
docker compose -f docker-compose.ghcr.yml --env-file $EnvFile up -d

Write-Host "Listo. Revisa logs con: docker compose -f docker-compose.ghcr.yml --env-file $EnvFile logs -f api-gateway" -ForegroundColor Green

