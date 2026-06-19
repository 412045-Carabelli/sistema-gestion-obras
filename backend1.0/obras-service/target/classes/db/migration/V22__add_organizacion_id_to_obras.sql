IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('obras') AND name = 'organizacion_id')
    ALTER TABLE obras ADD organizacion_id BIGINT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('grupos_obras') AND name = 'organizacion_id')
    ALTER TABLE grupos_obras ADD organizacion_id BIGINT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('obras') AND name = 'idx_obras_organizacion_id')
    CREATE INDEX idx_obras_organizacion_id ON obras(organizacion_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('grupos_obras') AND name = 'idx_grupos_obras_organizacion_id')
    CREATE INDEX idx_grupos_obras_organizacion_id ON grupos_obras(organizacion_id);
