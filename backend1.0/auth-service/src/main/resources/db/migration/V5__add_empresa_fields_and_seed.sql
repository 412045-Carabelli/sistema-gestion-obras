-- V5: Agregar campos a organizaciones + seed Meliquina + usuario Pablo

-- 1. Nuevos campos opcionales en organizaciones
ALTER TABLE organizaciones ADD cuit          NVARCHAR(20)  NULL;
GO
ALTER TABLE organizaciones ADD razon_social  NVARCHAR(255) NULL;
GO
ALTER TABLE organizaciones ADD email         NVARCHAR(255) NULL;
GO
ALTER TABLE organizaciones ADD telefono      NVARCHAR(50)  NULL;
GO
ALTER TABLE organizaciones ADD direccion     NVARCHAR(500) NULL;
GO

-- 2. Seed empresa 1: Meliquina Construcciones
SET IDENTITY_INSERT organizaciones ON;
GO

MERGE organizaciones AS target
USING (SELECT 1 AS id) AS src ON target.id = src.id
WHEN NOT MATCHED THEN
    INSERT (id, nombre, razon_social, activo, creado_en)
    VALUES (1, 'Meliquina Construcciones', 'Meliquina Construcciones S.R.L.', 1, GETDATE());
GO

SET IDENTITY_INSERT organizaciones OFF;
GO

-- 3. Usuario de prueba: pablo
--    Password: Pablo2025!
--    Hash BCrypt(10): $2a$10$txwfniFlssURENVDo1gvc.nrldC5Gy9lpuSA2U5y0wjFK.UoF7c2G
SET IDENTITY_INSERT usuarios ON;
GO

MERGE usuarios AS target
USING (SELECT 99 AS id) AS src ON target.id = src.id
WHEN NOT MATCHED THEN
    INSERT (id, email, username, password_hash, rol, activo, intentos_fallidos, creado_en)
    VALUES (99, 'pablo@meliquina.com', 'pablo', '$2a$10$txwfniFlssURENVDo1gvc.nrldC5Gy9lpuSA2U5y0wjFK.UoF7c2G', 'ADMIN', 1, 0, GETDATE());
GO

SET IDENTITY_INSERT usuarios OFF;
GO

-- 4. Vincular pablo con Meliquina Construcciones
MERGE usuario_organizacion AS target
USING (SELECT 99 AS usuario_id, 1 AS organizacion_id) AS src
    ON target.usuario_id = src.usuario_id AND target.organizacion_id = src.organizacion_id
WHEN NOT MATCHED THEN
    INSERT (usuario_id, organizacion_id, rol, activo)
    VALUES (99, 1, 'ADMIN', 1);
GO
