-- V31: Agregar creado_en para contar transacciones por mes (límite de plan)
-- GO separa batches para que SQL Server re-parsee después del ALTER TABLE ADD

ALTER TABLE transacciones
    ADD creado_en DATETIME2 NULL;
GO

UPDATE transacciones
SET creado_en = ultima_actualizacion
WHERE creado_en IS NULL;
GO

CREATE INDEX idx_transacciones_org_creado ON transacciones(organizacion_id, creado_en);
GO
