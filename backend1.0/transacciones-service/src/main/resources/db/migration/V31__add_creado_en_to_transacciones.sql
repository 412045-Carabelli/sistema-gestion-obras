-- V31: Agregar creado_en para poder contar transacciones por mes (límite de plan)
ALTER TABLE transacciones
    ADD creado_en DATETIME2 NULL;

-- Backfill: usar ultima_actualizacion de los registros creados (tipo_actualizacion = 'CREATE')
UPDATE transacciones
SET creado_en = ultima_actualizacion
WHERE creado_en IS NULL;

CREATE INDEX idx_transacciones_org_creado ON transacciones(organizacion_id, creado_en);
