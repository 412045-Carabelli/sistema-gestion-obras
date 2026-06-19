IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('proveedores') AND name = 'organizacion_id')
    ALTER TABLE proveedores ADD organizacion_id BIGINT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('proveedores') AND name = 'idx_proveedores_organizacion_id')
    CREATE INDEX idx_proveedores_organizacion_id ON proveedores(organizacion_id);
