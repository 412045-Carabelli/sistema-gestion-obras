#!/bin/bash
set -euo pipefail

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
LOG_PREFIX="[SGO-BACKUP $DATE]"

echo "$LOG_PREFIX === Iniciando backup semanal ==="

# ─── SQL Server ────────────────────────────────────────────────────────────────
DATABASES=(
    "sgo_auth"
    "sgo_obras"
    "sgo_clientes"
    "sgo_proveedores"
    "sgo_transacciones"
    "sgo_documentos"
    "sgo_agendas"
    "n8n"
)

DB_ERRORS=0
for DB in "${DATABASES[@]}"; do
    echo "$LOG_PREFIX Backup DB: $DB..."
    sqlcmd \
        -S "${DB_HOST:-sqlserver},${DB_PORT:-1433}" \
        -U "${DB_USER:-sa}" \
        -P "${DB_PASSWORD}" \
        -C \
        -Q "BACKUP DATABASE [$DB] TO DISK = N'${BACKUP_DIR}/${DB}_${DATE}.bak' WITH NOFORMAT, INIT, NAME = '${DB}-weekly', SKIP, NOREWIND, NOUNLOAD, STATS = 10" \
    && echo "$LOG_PREFIX ✓ $DB OK" \
    || { echo "$LOG_PREFIX ✗ $DB FAILED"; DB_ERRORS=$((DB_ERRORS + 1)); }
done

# ─── MinIO ─────────────────────────────────────────────────────────────────────
echo "$LOG_PREFIX Backup MinIO..."
tar -czf "${BACKUP_DIR}/minio_${DATE}.tar.gz" \
    --exclude='./tmp' \
    --exclude='./.minio.sys/tmp' \
    -C /minio-data . \
    && echo "$LOG_PREFIX ✓ MinIO OK" \
    || { echo "$LOG_PREFIX ✗ MinIO FAILED"; }

# ─── Limpieza: retener últimas 4 semanas ───────────────────────────────────────
echo "$LOG_PREFIX Limpiando backups > 28 días..."
find "$BACKUP_DIR" -name "*.bak"          -mtime +28 -delete
find "$BACKUP_DIR" -name "minio_*.tar.gz" -mtime +28 -delete

# ─── Resumen ───────────────────────────────────────────────────────────────────
echo "$LOG_PREFIX === Backup completo. Errores DB: $DB_ERRORS ==="
ls -lh "$BACKUP_DIR"
