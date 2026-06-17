-- V20__add_empresa_id.sql
-- Agrega empresa_id a obras para multi-tenancy

ALTER TABLE obras ADD empresa_id BIGINT NULL;
GO

-- Datos existentes asignados a empresa 1 (primera empresa registrada)
UPDATE obras SET empresa_id = 1 WHERE empresa_id IS NULL;
GO

CREATE INDEX idx_obras_empresa_id ON obras(empresa_id);
