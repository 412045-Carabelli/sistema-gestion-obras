ALTER TABLE transacciones ADD organizacion_id BIGINT NOT NULL DEFAULT 0;
CREATE INDEX idx_transacciones_organizacion_id ON transacciones(organizacion_id);
