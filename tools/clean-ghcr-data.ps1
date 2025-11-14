Param(
  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Remove-NamedVolume($name) {
  $exists = (docker volume ls --format '{{.Name}}' | Where-Object { $_ -eq $name })
  if ($exists) {
    Write-Host "Eliminando volumen: $name" -ForegroundColor Yellow
    docker volume rm $name | Out-Null
  } else {
    Write-Host "Volumen no existe: $name" -ForegroundColor DarkGray
  }
}

$vols = @(
  'sistema-gestion-obras_obras_data',
  'sistema-gestion-obras_clientes_data',
  'sistema-gestion-obras_proveedores_data',
  'sistema-gestion-obras_documentos_data',
  'sistema-gestion-obras_documentos_uploads',
  'sistema-gestion-obras_transacciones_data',
  'sistema-gestion-obras_reportes_data'
)

if (-not $Force) {
  Write-Host "Esto eliminará PERMANENTEMENTE datos de producción (compose GHCR)." -ForegroundColor Red
  $confirm = Read-Host "Escribe YES para continuar"
  if ($confirm -ne 'YES') { Write-Host 'Cancelado.'; exit 1 }
}

foreach ($v in $vols) { Remove-NamedVolume $v }

Write-Host "Listo. Vuelve a levantar con docker compose -f docker-compose.ghcr.yml --env-file .env up -d" -ForegroundColor Green

