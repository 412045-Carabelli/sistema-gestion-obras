-- V4__add_empresa_id.sql
-- Agrega empresa_id a tareas para multi-tenancy

ALTER TABLE tareas ADD empresa_id BIGINT NULL;
GO

UPDATE tareas SET empresa_id = 1 WHERE empresa_id IS NULL;
GO

CREATE INDEX idx_tareas_empresa_id ON tareas(empresa_id);
