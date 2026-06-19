IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('auditoria') AND type = 'U')
CREATE TABLE auditoria (
    id           BIGINT NOT NULL PRIMARY KEY IDENTITY(1,1),
    usuario      NVARCHAR(255),
    ip           NVARCHAR(100),
    tipo_request NVARCHAR(10),
    endpoint     NVARCHAR(500),
    modulo       NVARCHAR(100),
    tabla_modificada NVARCHAR(100),
    codigo_respuesta INT,
    respuesta    NVARCHAR(MAX),
    fecha_hora   DATETIME2 NOT NULL DEFAULT GETDATE()
);
