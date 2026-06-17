CREATE TABLE tareas (
    id                   BIGINT IDENTITY(1,1) PRIMARY KEY,
    titulo               VARCHAR(255) NOT NULL,
    obra_id              BIGINT,
    cliente_id           BIGINT,
    proveedor_id         BIGINT,
    estado               VARCHAR(50)  NOT NULL DEFAULT 'PENDIENTE',
    descripcion          NVARCHAR(MAX),
    fecha_vencimiento    DATETIME2,
    creado_en            DATETIME2,
    ultima_actualizacion DATETIME2,
    tipo_actualizacion   VARCHAR(255)
);
