-- V21__add_empresa_id.sql
-- Agrega empresa_id a transacciones y facturas para multi-tenancy

ALTER TABLE transacciones ADD empresa_id BIGINT NULL;
GO

UPDATE transacciones SET empresa_id = 1 WHERE empresa_id IS NULL;
GO

CREATE INDEX idx_transacciones_empresa_id ON transacciones(empresa_id);
GO

ALTER TABLE facturas ADD empresa_id BIGINT NULL;
GO

UPDATE facturas SET empresa_id = 1 WHERE empresa_id IS NULL;
GO

CREATE INDEX idx_facturas_empresa_id ON facturas(empresa_id);
