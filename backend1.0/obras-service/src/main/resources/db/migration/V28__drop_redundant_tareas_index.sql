-- idx_tareas_id_obra es redundante: idx_tareas_obra_activo (id_obra, activo)
-- ya cubre consultas que filtran solo por id_obra (primera columna del compuesto).
-- Mantener ambos gasta espacio y penaliza INSERT/UPDATE/DELETE sobre tareas.
DROP INDEX IF EXISTS idx_tareas_id_obra ON tareas;
