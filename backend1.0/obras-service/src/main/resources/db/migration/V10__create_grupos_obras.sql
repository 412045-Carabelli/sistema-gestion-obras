-- Tabla para agrupar obras por cliente
-- Permite separar visualmente obras en reportes según su grupo/cliente

CREATE TABLE grupos_obras (
    id                   BIGINT IDENTITY(1,1) PRIMARY KEY,
    id_cliente           BIGINT        NOT NULL,
    nombre               VARCHAR(255)  NOT NULL,
    activo               BIT           DEFAULT 1,
    creado_en            DATETIME2     DEFAULT GETDATE(),
    ultima_actualizacion DATETIME2,
    tipo_actualizacion   VARCHAR(255)
);

CREATE INDEX idx_grupos_obras_id_cliente ON grupos_obras(id_cliente);
