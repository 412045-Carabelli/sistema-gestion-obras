-- V2__add_empresa_id.sql
-- Agrega empresa_id a proveedores para multi-tenancy

ALTER TABLE proveedores ADD empresa_id BIGINT NULL;
GO

UPDATE proveedores SET empresa_id = 1 WHERE empresa_id IS NULL;
GO

CREATE INDEX idx_proveedores_empresa_id ON proveedores(empresa_id);
