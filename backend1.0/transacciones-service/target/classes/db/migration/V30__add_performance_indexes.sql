-- Índices de performance para queries frecuentes en SPs y repositorios

-- transacciones: filtros más usados en SPs de dashboard, cuenta corriente y deudas
CREATE INDEX idx_transacciones_id_obra        ON transacciones(id_obra);
CREATE INDEX idx_transacciones_activo         ON transacciones(activo);
CREATE INDEX idx_transacciones_asociado       ON transacciones(tipo_asociado, id_asociado);
CREATE INDEX idx_transacciones_obra_activo    ON transacciones(id_obra, activo);
CREATE INDEX idx_transacciones_fecha          ON transacciones(fecha);

-- facturas: filtros por cliente y obra
CREATE INDEX idx_facturas_id_cliente          ON facturas(id_cliente);
CREATE INDEX idx_facturas_id_obra             ON facturas(id_obra);
CREATE INDEX idx_facturas_activo              ON facturas(activo);
