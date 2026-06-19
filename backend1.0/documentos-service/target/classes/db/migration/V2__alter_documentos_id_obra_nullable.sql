-- Permitir id_obra NULL en documentos (para cuentas corrientes sin obra específica)
ALTER TABLE documentos ALTER COLUMN id_obra BIGINT NULL;
