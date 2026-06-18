IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tareas') AND name = 'prioridad')
    ALTER TABLE tareas ADD prioridad NVARCHAR(10) NOT NULL DEFAULT 'MEDIA';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tareas') AND name = 'organizacion_id')
    ALTER TABLE tareas ADD organizacion_id BIGINT NOT NULL DEFAULT 1;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('tareas') AND name = 'idx_tareas_organizacion_id')
    CREATE INDEX idx_tareas_organizacion_id ON tareas(organizacion_id);
