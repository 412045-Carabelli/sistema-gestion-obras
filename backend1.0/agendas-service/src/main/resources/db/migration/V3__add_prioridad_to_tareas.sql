-- Agregar columna prioridad a tabla tareas
-- Valores: ALTA, MEDIA, BAJA. Default MEDIA para registros existentes.
ALTER TABLE tareas ADD prioridad NVARCHAR(10) NOT NULL DEFAULT 'MEDIA';
