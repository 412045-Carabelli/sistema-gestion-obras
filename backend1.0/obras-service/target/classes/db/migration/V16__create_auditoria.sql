CREATE TABLE auditoria (
    id                BIGINT NOT NULL PRIMARY KEY IDENTITY(1,1),
    modulo            NVARCHAR(80)  NOT NULL,
    tipo_request      NVARCHAR(10)  NOT NULL,
    endpoint          NVARCHAR(255) NOT NULL,
    tabla_modificada  NVARCHAR(80),
    codigo_respuesta  INT,
    respuesta         NVARCHAR(MAX),
    fecha_hora        DATETIME2     NOT NULL,
    usuario           NVARCHAR(120),
    ip                NVARCHAR(60)
);
