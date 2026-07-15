-- V26__add_organizacion_id_to_app_config.sql
-- Reestructura app_config para soportar configuración por organización.
-- Idempotente: verifica estado previo antes de cada operación.

-- ── Caso A: tabla ya tiene la nueva estructura (columna 'id' BIGINT existe) ──────────────────
-- Solo agregar organizacion_id si falta
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('app_config') AND name = 'id')
  AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('app_config') AND name = 'organizacion_id')
BEGIN
    ALTER TABLE app_config ADD organizacion_id BIGINT NULL;
END
GO

-- ── Caso B: tabla tiene estructura vieja (PK = clave string) ─────────────────────────────────
-- Reestructurar completamente solo si 'id' columna no existe aún
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('app_config') AND name = 'id')
BEGIN
    -- Backup datos existentes (sin organizacion_id que no existe todavia)
    SELECT clave, valor, descripcion, actualizado_en
    INTO #app_config_bkp
    FROM app_config;

    DROP TABLE app_config;

    CREATE TABLE app_config (
        id              BIGINT          NOT NULL PRIMARY KEY IDENTITY(1,1),
        clave           NVARCHAR(100)   NOT NULL,
        valor           NVARCHAR(MAX),
        descripcion     NVARCHAR(255),
        actualizado_en  DATETIME2       NOT NULL DEFAULT GETDATE(),
        organizacion_id BIGINT          NULL
    );

    INSERT INTO app_config (clave, valor, descripcion, actualizado_en, organizacion_id)
    SELECT clave, valor, descripcion, actualizado_en, NULL
    FROM #app_config_bkp;

    DROP TABLE #app_config_bkp;
END
GO

-- ── Índices (solo si no existen) ──────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('app_config') AND name = 'idx_app_config_organizacion')
BEGIN
    CREATE INDEX idx_app_config_organizacion ON app_config(organizacion_id);
END
GO
