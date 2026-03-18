param(
    [string]$OutputDir = ".\migration-backups",
    [switch]$IncludeSqlServer
)

$ErrorActionPreference = "Stop"

$volumeBackups = @(
    @{ Name = "obras_data"; File = "obras_data.tar.gz" },
    @{ Name = "clientes_data"; File = "clientes_data.tar.gz" },
    @{ Name = "proveedores_data"; File = "proveedores_data.tar.gz" },
    @{ Name = "documentos_data"; File = "documentos_data.tar.gz" },
    @{ Name = "documentos_uploads"; File = "documentos_uploads.tar.gz" },
    @{ Name = "transacciones_data"; File = "transacciones_data.tar.gz" },
    @{ Name = "reportes_data"; File = "reportes_data.tar.gz" },
    @{ Name = "backup_artifacts"; File = "backup_artifacts.tar.gz" },
    @{ Name = "minio_data"; File = "minio_data.tar.gz" }
)

if ($IncludeSqlServer) {
    $volumeBackups += @{ Name = "mssql_data"; File = "mssql_data.tar.gz" }
}

$resolvedOutputDir = Resolve-Path -Path $OutputDir -ErrorAction SilentlyContinue
if (-not $resolvedOutputDir) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    $resolvedOutputDir = Resolve-Path -Path $OutputDir
}

Write-Host "Guardando backups en $resolvedOutputDir"

foreach ($item in $volumeBackups) {
    $volumeName = $item.Name
    $archiveName = $item.File

    docker volume inspect $volumeName *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Se omite $volumeName porque no existe."
        continue
    }

    Write-Host "Respaldando $volumeName ..."
    docker run --rm `
        -v "${volumeName}:/volume" `
        -v "${resolvedOutputDir}:/backup" `
        alpine sh -c "cd /volume && tar czf /backup/${archiveName} ."

    if ($LASTEXITCODE -ne 0) {
        throw "Fallo el backup del volumen $volumeName"
    }
}

Write-Host "Backup de volumenes completado."
