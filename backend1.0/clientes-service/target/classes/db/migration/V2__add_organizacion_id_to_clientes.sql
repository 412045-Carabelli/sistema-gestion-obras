ALTER TABLE clientes ADD organizacion_id BIGINT NOT NULL DEFAULT 0;
CREATE INDEX idx_clientes_organizacion_id ON clientes(organizacion_id);
