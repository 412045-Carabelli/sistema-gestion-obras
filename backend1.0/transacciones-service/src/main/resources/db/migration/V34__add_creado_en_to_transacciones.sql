-- V34: Agregar creado_en para contar transacciones por mes (límite de plan)
-- Idempotente: la base de dev es compartida entre ramas y la columna/indice
-- pueden haber sido creados ya por otra rama sobre la misma base.

IF COL_LENGTH('transacciones', 'creado_en') IS NULL
BEGIN
    ALTER TABLE transacciones
        ADD creado_en DATETIME2 NULL;
END
GO

UPDATE transacciones
SET creado_en = ultima_actualizacion
WHERE creado_en IS NULL;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'idx_transacciones_org_creado' AND object_id = OBJECT_ID('transacciones')
)
BEGIN
    CREATE INDEX idx_transacciones_org_creado ON transacciones(organizacion_id, creado_en);
END
GO
