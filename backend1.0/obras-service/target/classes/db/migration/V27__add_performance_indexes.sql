-- Índices de performance para queries frecuentes en tareas, costos y obras

-- tareas: JOIN y filtros por obra y estado
CREATE INDEX idx_tareas_id_obra       ON tareas(id_obra);
CREATE INDEX idx_tareas_estado        ON tareas(estado_tarea);
CREATE INDEX idx_tareas_activo        ON tareas(activo);
CREATE INDEX idx_tareas_obra_activo   ON tareas(id_obra, activo);

-- obra_costo: JOIN por obra y proveedor (SPs de saldos y reportes)
CREATE INDEX idx_obra_costo_id_obra       ON obra_costo(id_obra);
CREATE INDEX idx_obra_costo_id_proveedor  ON obra_costo(id_proveedor);
CREATE INDEX idx_obra_costo_activo        ON obra_costo(activo);

-- obras: filtros frecuentes por cliente, estado y grupo
CREATE INDEX idx_obras_id_cliente     ON obras(id_cliente);
CREATE INDEX idx_obras_estado         ON obras(estado_obra);
CREATE INDEX idx_obras_activo         ON obras(activo);
